package com.mgk.bemgk.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MedicalDocumentCleanupRunner {

	private static final String TARGET_TABLE_NAME = "medical_documents";
	private static final String LEGACY_TABLE_NAME = "medical_document";

	private final DataSource dataSource;
	private final JdbcTemplate jdbcTemplate;

	@Bean
	public ApplicationRunner medicalDocumentCleanupApplicationRunner() {
		return args -> {
			migrateMedicalDocumentTable();

			if (!hasTable(TARGET_TABLE_NAME) || !hasColumn(TARGET_TABLE_NAME, "name")) {
				return;
			}

			int deletedRows = jdbcTemplate.update(
				"delete from " + TARGET_TABLE_NAME + " where name is not null and name <> ''"
			);

			if (deletedRows > 0) {
				log.info("Deleted {} legacy medical document rows that still used the name column.", deletedRows);
			}

			jdbcTemplate.execute("alter table " + TARGET_TABLE_NAME + " drop column name");
			log.info("Dropped legacy column name from table {}.", TARGET_TABLE_NAME);
		};
	}

	private void migrateMedicalDocumentTable() throws SQLException {
		boolean hasLegacyTable = hasTable(LEGACY_TABLE_NAME);
		boolean hasTargetTable = hasTable(TARGET_TABLE_NAME);

		if (!hasLegacyTable) {
			return;
		}

		if (hasTargetTable) {
			jdbcTemplate.execute("drop table " + TARGET_TABLE_NAME);
			log.info("Dropped duplicate table {} before migration.", TARGET_TABLE_NAME);
		}

		jdbcTemplate.execute("alter table " + LEGACY_TABLE_NAME + " rename " + TARGET_TABLE_NAME);
		log.info("Renamed table {} to {}.", LEGACY_TABLE_NAME, TARGET_TABLE_NAME);
	}

	private boolean hasTable(String tableName) throws SQLException {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			return hasTable(metaData, tableName) || hasTable(metaData, tableName.toUpperCase());
		}
	}

	private boolean hasTable(DatabaseMetaData metaData, String tableName) throws SQLException {
		try (ResultSet resultSet = metaData.getTables(null, null, tableName, null)) {
			return resultSet.next();
		}
	}

	private boolean hasColumn(String tableName, String columnName) throws SQLException {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();

			if (hasColumn(metaData, tableName, columnName)) {
				return true;
			}
			return hasColumn(metaData, tableName.toUpperCase(), columnName.toUpperCase());
		}
	}

	private boolean hasColumn(DatabaseMetaData metaData, String tableName, String columnName) throws SQLException {
		try (ResultSet resultSet = metaData.getColumns(null, null, tableName, columnName)) {
			return resultSet.next();
		}
	}
}
