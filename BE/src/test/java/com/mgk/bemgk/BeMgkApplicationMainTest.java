package com.mgk.bemgk;

import static org.mockito.Mockito.mockStatic;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

class BeMgkApplicationMainTest {

	@Test
	void main_invokesSpringApplicationRun() {
		try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
			BeMgkApplication.main(new String[] {"--spring.profiles.active=test"});

			springApplication.verify(() ->
				SpringApplication.run(BeMgkApplication.class, new String[] {"--spring.profiles.active=test"}));
		}
	}
}
