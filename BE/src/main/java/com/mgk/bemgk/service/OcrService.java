package com.mgk.bemgk.service;

import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Feature.Type;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.protobuf.ByteString;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.medical.OcrResponseDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OcrService {

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "(20\\d{2}|19\\d{2})[./-]\\s?(\\d{1,2})[./-]\\s?(\\d{1,2})|(20\\d{2}|19\\d{2})년\\s?(\\d{1,2})월\\s?(\\d{1,2})일"
    );
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\\s*원?");
    private static final List<String> HOSPITAL_KEYWORDS = List.of("동물병원", "동물의원", "동물메디컬센터", "동물의료센터", "메디컬센터", "병원");
    private static final List<String> VACCINATION_KEYWORDS = List.of("접종", "백신", "예방", "vaccination", "vaccine");
    private static final List<String> MEDICAL_DETAIL_KEYWORDS = List.of(
            "기본 진료", "초진", "재진", "예방접종", "접종", "백신", "광견병", "종합백신",
            "검사", "처방", "상담", "내원", "진료", "치료", "수술", "주사", "투약"
    );
    private static final List<String> DETAIL_EXCLUDED_KEYWORDS = List.of(
            "영수증", "계산서", "진료비 계산서", "진료비영수증", "수납", "합계", "총액", "금액", "청구",
            "결제", "카드", "현금", "부가세", "공급가액", "승인", "매출전표", "과세", "면세",
            "보호자", "사업자", "전화", "주소", "발행", "서명", "원무", "계", "잔액",
            "서울특별시", "서울시", "경기도", "인천광역시", "부산광역시", "대구광역시",
            "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "제주특별자치도",
            "반려동물", "동물명", "환자명", "이름", "pet name", "patient name", "보호자명"
    );
    private static final List<String> DETAIL_HEADER_KEYWORDS = List.of(
            "품명", "항목", "내역", "수가", "단가", "수량", "금액", "비용", "진료항목", "진료내역"
    );
    private static final List<String> NON_MEDICAL_LABEL_KEYWORDS = List.of(
            "반려동물 이름", "반려동물명", "동물명", "환자명", "이름", "보호자", "보호자명",
            "주소", "전화", "전화번호", "연락처", "품종", "성별", "나이", "등록번호",
            "사업자번호", "사업자 등록번호", "병원명", "대표자", "수의사", "접수", "차트번호"
    );

    private final ImageAnnotatorClient visionClient;

    public OcrResponseDto processMedicalReceipt(MultipartFile file) {
        String rawText = detectText(file);
        List<String> lines = rawText.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .toList();

        return OcrResponseDto.builder()
                .date(extractDate(rawText).map(LocalDate::toString).orElse(""))
                .type(extractType(rawText))
                .petName(extractPetName(lines).orElse(""))
                .hospitalName(extractHospitalName(lines).orElse(""))
                .details(extractDetails(lines).orElse(""))
                .totalAmount(extractAmount(lines).orElse(null))
                .rawText(rawText)
                .build();
    }

    private String detectText(MultipartFile file) {
        try {
            ByteString content = ByteString.copyFrom(file.getBytes());
            Image image = Image.newBuilder().setContent(content).build();
            Feature feature = Feature.newBuilder().setType(Type.DOCUMENT_TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feature)
                    .setImage(image)
                    .build();

            BatchAnnotateImagesResponse response = visionClient.batchAnnotateImages(List.of(request));
            AnnotateImageResponse imageResponse = response.getResponsesList().stream()
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "OCR 응답을 받지 못했습니다."
                    ));

            if (imageResponse.hasError()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Vision OCR 호출에 실패했습니다: " + imageResponse.getError().getMessage()
                );
            }

            if (imageResponse.hasFullTextAnnotation()) {
                return imageResponse.getFullTextAnnotation().getText();
            }

            return imageResponse.getTextAnnotationsList().stream()
                    .findFirst()
                    .map(annotation -> annotation.getDescription())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "이미지에서 텍스트를 인식하지 못했습니다."
                    ));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "OCR 처리 중 오류가 발생했습니다.",
                    exception
            );
        }
    }

    private Optional<LocalDate> extractDate(String rawText) {
        Matcher matcher = DATE_PATTERN.matcher(rawText);
        if (!matcher.find()) {
            return Optional.empty();
        }

        if (matcher.group(1) != null) {
            return parseDate(matcher.group(1), matcher.group(2), matcher.group(3));
        }
        return parseDate(matcher.group(4), matcher.group(5), matcher.group(6));
    }

    private Optional<LocalDate> parseDate(String year, String month, String day) {
        try {
            return Optional.of(LocalDate.parse(
                    "%s-%02d-%02d".formatted(year, Integer.parseInt(month), Integer.parseInt(day)),
                    DateTimeFormatter.ISO_LOCAL_DATE
            ));
        } catch (DateTimeParseException | NumberFormatException exception) {
            return Optional.empty();
        }
    }

    private String extractType(String rawText) {
        String lowerCased = rawText.toLowerCase(Locale.ROOT);
        return VACCINATION_KEYWORDS.stream().anyMatch(lowerCased::contains) ? "접종" : "진료";
    }

    private Optional<String> extractPetName(List<String> lines) {
        List<Pattern> patterns = List.of(
                Pattern.compile("(?:환자명|반려동물명|동물명|이름|보호동물)\\s*[:：]?\\s*([가-힣a-zA-Z0-9]+)"),
                Pattern.compile("(?:pet name|patient)\\s*[:：]?\\s*([a-zA-Z0-9]+)", Pattern.CASE_INSENSITIVE)
        );

        for (String line : lines) {
            for (Pattern pattern : patterns) {
                Matcher matcher = pattern.matcher(line);
                if (matcher.find()) {
                    return Optional.of(matcher.group(1).trim());
                }
            }
        }
        return Optional.empty();
    }

    private Optional<String> extractHospitalName(List<String> lines) {
        return lines.stream()
                .filter(line -> HOSPITAL_KEYWORDS.stream().anyMatch(line::contains))
                .min(Comparator.comparingInt(String::length));
    }

    private Optional<String> extractDetails(List<String> lines) {
        List<String> candidates = new ArrayList<>();
        for (String line : lines) {
            String cleanedLine = normalizeDetailLine(line);
            if (cleanedLine.length() < 2) {
                continue;
            }
            if (isMetadataLine(cleanedLine) || isExcludedDetailLine(cleanedLine)) {
                continue;
            }
            if (containsMedicalDetailKeyword(cleanedLine) || looksLikeMedicalItem(cleanedLine)) {
                candidates.add(cleanedLine);
            }
        }

        if (!candidates.isEmpty()) {
            return Optional.of(String.join(" / ", candidates.stream().distinct().toList()));
        }

        return lines.stream()
                .map(this::normalizeDetailLine)
                .filter(line -> !line.isBlank())
                .filter(line -> !isMetadataLine(line))
                .filter(line -> !isExcludedDetailLine(line))
                .filter(line -> containsMedicalDetailKeyword(line) || looksLikeMedicalItem(line))
                .findFirst();
    }

    private boolean isMetadataLine(String line) {
        return HOSPITAL_KEYWORDS.stream().anyMatch(line::contains)
                || line.contains("합계")
                || line.contains("총액")
                || line.contains("금액")
                || line.contains("수납")
                || line.contains("카드")
                || line.contains("현금")
                || DATE_PATTERN.matcher(line).find();
    }

    private boolean containsMedicalDetailKeyword(String line) {
        return MEDICAL_DETAIL_KEYWORDS.stream().anyMatch(line::contains);
    }

    private boolean isExcludedDetailLine(String line) {
        return DETAIL_EXCLUDED_KEYWORDS.stream().anyMatch(line::contains)
                || DETAIL_HEADER_KEYWORDS.stream().anyMatch(line::equals)
                || isNonMedicalLabeledLine(line)
                || containsAddress(line)
                || containsPhoneNumber(line)
                || line.matches(".*\\b(?:no|tel|fax)\\b.*")
                || line.matches(".*\\d{2,}[-/]\\d{2,}[-/]\\d{2,}.*")
                || countDigits(line) >= Math.max(5, line.length() / 2);
    }

    private boolean looksLikeMedicalItem(String line) {
        if (line.length() < 2 || line.length() > 40) {
            return false;
        }
        if (DETAIL_HEADER_KEYWORDS.stream().anyMatch(line::contains)) {
            return false;
        }
        if (!line.matches(".*[가-힣A-Za-z].*")) {
            return false;
        }
        return !isNonMedicalLabeledLine(line)
                && !containsAddress(line)
                && !containsPhoneNumber(line)
                && !line.contains("http")
                && !line.contains("www")
                && !line.contains("@");
    }

    private String normalizeDetailLine(String line) {
        return line
                .replaceAll("\\s+", " ")
                .replaceAll("^[\\-\\*•·]+\\s*", "")
                .replaceAll("\\s*[0-9,]+원?$", "")
                .replaceAll("\\s*[xX×]\\s*[0-9]+$", "")
                .trim();
    }

    private int countDigits(String line) {
        int count = 0;
        for (char character : line.toCharArray()) {
            if (Character.isDigit(character)) {
                count += 1;
            }
        }
        return count;
    }

    private boolean isNonMedicalLabeledLine(String line) {
        if (!(line.contains(":") || line.contains("："))) {
            return false;
        }

        String normalized = line.replace("：", ":");
        int separatorIndex = normalized.indexOf(':');
        if (separatorIndex < 0) {
            return false;
        }

        String label = normalized.substring(0, separatorIndex).trim().toLowerCase(Locale.ROOT);
        return NON_MEDICAL_LABEL_KEYWORDS.stream()
                .map(keyword -> keyword.toLowerCase(Locale.ROOT))
                .anyMatch(label::contains);
    }

    private boolean containsAddress(String line) {
        return line.contains("특별시")
                || line.contains("광역시")
                || line.contains("특별자치시")
                || line.contains("특별자치도")
                || line.contains("경기도")
                || line.contains("강원도")
                || line.contains("충청북도")
                || line.contains("충청남도")
                || line.contains("전라북도")
                || line.contains("전라남도")
                || line.contains("경상북도")
                || line.contains("경상남도")
                || line.contains("시 ")
                || line.contains("구 ")
                || line.contains("동 ")
                || line.contains("로 ")
                || line.contains("길 ");
    }

    private boolean containsPhoneNumber(String line) {
        return line.matches(".*\\d{2,4}-\\d{3,4}-\\d{4}.*")
                || line.matches(".*\\d{2,4}-\\d{2,4}-.*")
                || line.matches(".*\\d{2,4}-\\d{3,4}.*")
                || line.matches(".*\\(\\d{2,4}\\)\\s*\\d{3,4}-\\d{4}.*");
    }

    private Optional<Integer> extractAmount(List<String> lines) {
        List<Integer> prioritizedAmounts = lines.stream()
                .filter(line -> line.contains("합계") || line.contains("총액") || line.contains("총 진료비")
                        || line.contains("수납") || line.contains("결제") || line.contains("청구"))
                .map(this::extractAmountsFromLine)
                .flatMap(List::stream)
                .toList();

        if (!prioritizedAmounts.isEmpty()) {
            return prioritizedAmounts.stream().max(Integer::compareTo);
        }

        return lines.stream()
                .map(this::extractAmountsFromLine)
                .flatMap(List::stream)
                .max(Integer::compareTo);
    }

    private List<Integer> extractAmountsFromLine(String line) {
        Matcher matcher = AMOUNT_PATTERN.matcher(line.replace(" ", ""));
        List<Integer> amounts = new ArrayList<>();
        while (matcher.find()) {
            amounts.add(Integer.parseInt(matcher.group(1).replace(",", "")));
        }
        return amounts;
    }
}
