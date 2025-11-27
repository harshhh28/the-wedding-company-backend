/**
 * Unit Tests for Error Codes
 */

const ERROR_CODES = require("../../../src/utils/errorCodes");

describe("Error Codes", () => {
  it("should have organization error codes", () => {
    expect(ERROR_CODES.ORG_ALREADY_EXISTS).toBe("ORG_ALREADY_EXISTS");
    expect(ERROR_CODES.ORG_NOT_FOUND).toBe("ORG_NOT_FOUND");
    expect(ERROR_CODES.ORG_NAME_REQUIRED).toBe("ORG_NAME_REQUIRED");
  });

  it("should have authentication error codes", () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ERROR_CODES.INVALID_CREDENTIALS).toBe("INVALID_CREDENTIALS");
    expect(ERROR_CODES.TOKEN_EXPIRED).toBe("TOKEN_EXPIRED");
    expect(ERROR_CODES.TOKEN_INVALID).toBe("TOKEN_INVALID");
    expect(ERROR_CODES.TOKEN_MISSING).toBe("TOKEN_MISSING");
  });

  it("should have validation error codes", () => {
    expect(ERROR_CODES.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ERROR_CODES.INVALID_INPUT).toBe("INVALID_INPUT");
  });

  it("should have server error codes", () => {
    expect(ERROR_CODES.SERVER_ERROR).toBe("SERVER_ERROR");
    expect(ERROR_CODES.DATABASE_ERROR).toBe("DATABASE_ERROR");
  });

  it("should have collection error codes", () => {
    expect(ERROR_CODES.COLLECTION_CREATE_FAILED).toBe(
      "COLLECTION_CREATE_FAILED"
    );
    expect(ERROR_CODES.COLLECTION_DELETE_FAILED).toBe(
      "COLLECTION_DELETE_FAILED"
    );
    expect(ERROR_CODES.COLLECTION_MIGRATE_FAILED).toBe(
      "COLLECTION_MIGRATE_FAILED"
    );
  });
});
