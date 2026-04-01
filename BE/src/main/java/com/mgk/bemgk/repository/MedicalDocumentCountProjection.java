package com.mgk.bemgk.repository;

public interface MedicalDocumentCountProjection {

    Long getPetId();

    String getType();

    String getName();

    Long getDocumentCount();
}
