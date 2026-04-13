package com.mgk.bemgk.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3Config {
	@Value("${cloud.aws.credentials.access-key}")
	private String accessKey;

	@Value("${cloud.aws.credentials.secret-key}")
	private String secretKey;

	@Value("${cloud.aws.s3.bucket.public}")
	private String publicBucket;

	@Value("${cloud.aws.s3.bucket.private}")
	private String privateBucket;

	@Value("${cloud.aws.region.static}")
	private String region;

	@Value("${cloud.aws.s3.endpoint:}") // 없으면 빈 문자열
	private String endpoint;


	@Bean
	public S3Client s3Client() {
		var builder = S3Client.builder()
			.region(Region.of(region))
			.credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)));

		if (!endpoint.isEmpty()) {
			builder.endpointOverride(URI.create(endpoint))
				.serviceConfiguration(S3Configuration.builder()
					.pathStyleAccessEnabled(true)
					.build());
		}

		return builder.build();
	}

	@Bean
	public S3Presigner s3Presigner() {
		var builder = S3Presigner.builder()
			.region(Region.of(region))
			.credentialsProvider(StaticCredentialsProvider.create(
				AwsBasicCredentials.create(accessKey, secretKey)
			));

		if (!endpoint.isEmpty()) {
			builder.endpointOverride(URI.create(endpoint))
				.serviceConfiguration(S3Configuration.builder()
					.pathStyleAccessEnabled(true)
					.build());
		}

		return builder.build();
	}
}
