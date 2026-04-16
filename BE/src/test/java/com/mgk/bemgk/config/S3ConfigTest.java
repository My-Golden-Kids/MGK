package com.mgk.bemgk.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

class S3ConfigTest {

	@Test
	void s3BeansAreCreatedWithoutEndpointOverride() {
		S3Config config = new S3Config();
		setCommonFields(config);
		ReflectionTestUtils.setField(config, "endpoint", "");

		S3Client s3Client = config.s3Client();
		S3Presigner s3Presigner = config.s3Presigner();

		assertThat(s3Client).isNotNull();
		assertThat(s3Presigner).isNotNull();
	}

	@Test
	void s3BeansAreCreatedWithEndpointOverride() {
		S3Config config = new S3Config();
		setCommonFields(config);
		ReflectionTestUtils.setField(config, "endpoint", "http://localhost:4566");

		S3Client s3Client = config.s3Client();
		S3Presigner s3Presigner = config.s3Presigner();

		assertThat(s3Client).isNotNull();
		assertThat(s3Presigner).isNotNull();
	}

	private void setCommonFields(S3Config config) {
		ReflectionTestUtils.setField(config, "accessKey", "test-access");
		ReflectionTestUtils.setField(config, "secretKey", "test-secret");
		ReflectionTestUtils.setField(config, "publicBucket", "public-bucket");
		ReflectionTestUtils.setField(config, "privateBucket", "private-bucket");
		ReflectionTestUtils.setField(config, "region", "ap-northeast-2");
	}
}
