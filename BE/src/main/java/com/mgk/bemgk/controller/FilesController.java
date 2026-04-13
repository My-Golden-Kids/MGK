package com.mgk.bemgk.controller;

import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.service.CurrentUserService;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/apis/files")
@RequiredArgsConstructor
public class FilesController {

	private static final Duration PRESIGN_DURATION = Duration.ofMinutes(10);
	private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/heic",
		"image/heif"
	);

	private final S3Presigner s3Presigner;
	private final CurrentUserService currentUserService;

	@Value("${cloud.aws.s3.bucket.public}")
	private String publicBucket;

	@Value("${cloud.aws.s3.bucket.private}")
	private String privateBucket;

	@Value("${cloud.aws.region.static}")
	private String region;

	@Value("${cloud.aws.s3.endpoint:}")
	private String endpoint;

	@GetMapping("/upload-url/static")
	public StaticUploadUrlResponse getStaticUploadUrl(
		@RequestParam String fileName,
		@RequestParam String contentType
	) {
		String key = "static/" + uniqName(fileName);
		return new StaticUploadUrlResponse(
			key,
			presignUploadUrl(publicBucket, key, contentType),
			buildPublicUrl(publicBucket, key)
		);
	}

	@GetMapping("/upload-url")
	public String getUploadUrl(@RequestParam String fileName, @RequestParam String contentType) {
		Long userId = currentUserService.getCurrentUserId();
		String key = userKey(userId, fileName);
		return presignUploadUrl(privateBucket, key, contentType);
	}

	@GetMapping("/download-url")
	public String getDownloadUrl(@RequestParam String fileName) {
		Long userId = currentUserService.getCurrentUserId();
		String key = userKey(userId, fileName);
		return presignDownloadUrl(privateBucket, key);
	}

	@PostMapping("/upload-urls")
	public UploadUrlsResponse getUploadUrls(@RequestBody UploadUrlsRequest request) {
		if (request == null || request.files() == null || request.files().isEmpty()) {
			throw new ResponseStatusException(BAD_REQUEST, "업로드할 파일 정보가 비어 있습니다.");
		}

		Long userId = currentUserService.getCurrentUserId();

		List<UploadUrlItem> files = request.files().stream()
			.map(file -> toUploadUrlItem(userId, file))
			.toList();

		return new UploadUrlsResponse(files);
	}

	private UploadUrlItem toUploadUrlItem(Long userId, UploadTarget file) {
		if (file == null) {
			throw new ResponseStatusException(BAD_REQUEST, "잘못된 파일 요청입니다.");
		}

		String key = userKey(userId, file.fileName());

		return new UploadUrlItem(
			file.fileName(),
			key,
			presignUploadUrl(privateBucket, key, file.contentType()),
			presignDownloadUrl(privateBucket, key)
		);
	}

	private String presignUploadUrl(String bucket, String key, String contentType) {
		validateImageRequest(key, contentType);

		PutObjectPresignRequest request = PutObjectPresignRequest.builder()
			.signatureDuration(PRESIGN_DURATION)
			.putObjectRequest(put -> put.bucket(bucket).key(key).contentType(contentType))
			.build();

		return s3Presigner.presignPutObject(request).url().toString();
	}

	private String presignDownloadUrl(String bucket, String key) {
		GetObjectPresignRequest request = GetObjectPresignRequest.builder()
			.signatureDuration(PRESIGN_DURATION)
			.getObjectRequest(get -> get.bucket(bucket).key(key))
			.build();

		return s3Presigner.presignGetObject(request).url().toString();
	}

	private String buildPublicUrl(String bucket, String key) {
		if (StringUtils.hasText(endpoint)) {
			return UriComponentsBuilder.fromUriString(endpoint)
				.pathSegment(bucket)
				.path("/" + key)
				.build(true)
				.toUriString();
		}

		return UriComponentsBuilder
			.fromUriString("https://%s.s3.%s.amazonaws.com".formatted(bucket, region))
			.path("/" + key)
			.build(true)
			.toUriString();
	}

	private void validateImageRequest(String fileName, String contentType) {
		if (!StringUtils.hasText(fileName)) {
			throw new ResponseStatusException(BAD_REQUEST, "파일 이름이 비어 있습니다.");
		}

		if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
			throw new ResponseStatusException(BAD_REQUEST, "허용되지 않는 파일 형식입니다.");
		}
	}

	private String userKey(Long userId, String fileName) {
		return "users/%d/%s".formatted(userId, normalizeFileName(fileName));
	}

	private String uniqName(String fileName) {
		return java.util.UUID.randomUUID() + "_" + normalizeFileName(fileName);
	}

	private String normalizeFileName(String fileName) {
		String normalized = Paths.get(fileName).getFileName().toString().trim();

		if (!StringUtils.hasText(normalized)) {
			throw new ResponseStatusException(BAD_REQUEST, "파일 이름이 비어 있습니다.");
		}

		return normalized;
	}

	public record UploadUrlsRequest(List<UploadTarget> files) {
	}

	public record UploadTarget(String fileName, String contentType) {
	}

	public record StaticUploadUrlResponse(String objectKey, String uploadUrl, String publicUrl) {
	}

	public record UploadUrlItem(
		String fileName,
		String objectKey,
		String uploadUrl,
		String downloadUrl
	) {
	}

	public record UploadUrlsResponse(List<UploadUrlItem> files) {
	}
}
