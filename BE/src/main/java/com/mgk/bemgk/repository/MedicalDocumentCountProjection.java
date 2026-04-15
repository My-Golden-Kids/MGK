package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.MedicalDocumentType;

public interface MedicalDocumentCountProjection {

	Long getPetId();

	MedicalDocumentType getType();

	String getDetails();

	Long getDocumentCount();
}
