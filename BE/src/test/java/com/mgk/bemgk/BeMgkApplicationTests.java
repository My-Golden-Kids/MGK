package com.mgk.bemgk;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.google.cloud.vision.v1.ImageAnnotatorClient;

@SpringBootTest
class BeMgkApplicationTests {
	@MockitoBean
	ImageAnnotatorClient imageAnnotatorClient;

    @Test
    void contextLoads() {
    }
}
