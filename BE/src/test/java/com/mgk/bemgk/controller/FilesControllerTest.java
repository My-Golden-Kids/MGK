package com.mgk.bemgk.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.service.CurrentUserService;
import java.net.URL;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

@ExtendWith(MockitoExtension.class)
class FilesControllerTest {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private MockMvc mockMvc;

	@Mock
	private S3Presigner s3Presigner;

	@Mock
	private CurrentUserService currentUserService;

	@InjectMocks
	private FilesController filesController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(filesController).build();
		ReflectionTestUtils.setField(filesController, "publicBucket", "public-bucket");
		ReflectionTestUtils.setField(filesController, "privateBucket", "private-bucket");
		ReflectionTestUtils.setField(filesController, "region", "ap-northeast-2");
		ReflectionTestUtils.setField(filesController, "endpoint", "");
	}

	@Test
	void getStaticUploadUrl_returnsPresignedUrls() throws Exception {
		PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
		when(presignedPut.url()).thenReturn(URL.of(new java.net.URI("https://upload.example.com"), null));
		when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);

		mockMvc.perform(get("/apis/files/upload-url/static")
				.param("fileName", "test.png")
				.param("contentType", "image/png"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.uploadUrl").value("https://upload.example.com"))
			.andExpect(jsonPath("$.publicUrl").exists());
	}

	@Test
	void getStaticUploadUrl_withDir_returnsDirScopedPublicUrl() throws Exception {
		PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
		when(presignedPut.url()).thenReturn(URL.of(new java.net.URI("https://upload.example.com"), null));
		when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);

		mockMvc.perform(get("/apis/files/upload-url/static")
				.param("fileName", "pet.png")
				.param("contentType", "image/png")
				.param("dir", "pet"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.objectKey").value(org.hamcrest.Matchers.containsString("static/")))
			.andExpect(jsonPath("$.publicUrl").value(org.hamcrest.Matchers.containsString("/static/")));
	}

	@Test
	void getStaticUploadUrl_withExpenseDir_returnsExpenseScopedPublicUrl() throws Exception {
		PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
		when(presignedPut.url()).thenReturn(URL.of(new java.net.URI("https://upload.example.com"), null));
		when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);

		mockMvc.perform(get("/apis/files/upload-url/static")
				.param("fileName", "receipt.png")
				.param("contentType", "image/png")
				.param("dir", "expense"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.objectKey").value(org.hamcrest.Matchers.containsString("expense/")))
			.andExpect(jsonPath("$.publicUrl").value(org.hamcrest.Matchers.containsString("/expense/")));
	}

	@Test
	void getUploadAndDownloadUrl_requireCurrentUserAndReturnPresignedUrls() throws Exception {
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
		PresignedGetObjectRequest presignedGet = mock(PresignedGetObjectRequest.class);
		when(presignedPut.url()).thenReturn(URL.of(new java.net.URI("https://upload.example.com"), null));
		when(presignedGet.url()).thenReturn(URL.of(new java.net.URI("https://download.example.com"), null));
		when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);
		when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedGet);

		mockMvc.perform(get("/apis/files/upload-url")
				.param("fileName", "test.png")
				.param("contentType", "image/png"))
			.andExpect(status().isOk());

		mockMvc.perform(get("/apis/files/download-url")
				.param("fileName", "test.png"))
			.andExpect(status().isOk());
	}

	@Test
	void uploadUrls_rejectsEmptyFiles() throws Exception {
		mockMvc.perform(post("/apis/files/upload-urls")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(new FilesController.UploadUrlsRequest(java.util.List.of()))))
			.andExpect(status().isBadRequest());
	}

	@Test
	void uploadUrls_successAndPublicEndpointBranch_areCovered() throws Exception {
		when(currentUserService.getCurrentUserId()).thenReturn(1L);
		PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
		PresignedGetObjectRequest presignedGet = mock(PresignedGetObjectRequest.class);
		when(presignedPut.url()).thenReturn(URL.of(new java.net.URI("https://upload.example.com"), null));
		when(presignedGet.url()).thenReturn(URL.of(new java.net.URI("https://download.example.com"), null));
		when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);
		when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedGet);
		ReflectionTestUtils.setField(filesController, "endpoint", "https://cdn.example.com");

		mockMvc.perform(post("/apis/files/upload-urls")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
					new FilesController.UploadUrlsRequest(List.of(new FilesController.UploadTarget("photo.png", "image/png"))))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.files[0].fileName").value("photo.png"))
			.andExpect(jsonPath("$.files[0].downloadUrl").value("https://download.example.com"));

		mockMvc.perform(get("/apis/files/upload-url/static")
				.param("fileName", "another.png")
				.param("contentType", "image/png"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.publicUrl").value(org.hamcrest.Matchers.containsString("https://cdn.example.com")));
	}
}
