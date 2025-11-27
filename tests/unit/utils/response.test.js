/**
 * Unit Tests for Response Utils
 */

const {
  successResponse,
  errorResponse,
} = require("../../../src/utils/response");

describe("Response Utils", () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("successResponse", () => {
    it("should return success response with default status 200", () => {
      successResponse(mockRes, "Success message", { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Success message",
        data: { id: 1 },
      });
    });

    it("should return success response with custom status code", () => {
      successResponse(mockRes, "Created", { id: 1 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Created",
        data: { id: 1 },
      });
    });

    it("should return empty data object by default", () => {
      successResponse(mockRes, "No data");

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "No data",
        data: {},
      });
    });
  });

  describe("errorResponse", () => {
    it("should return error response with default status 500", () => {
      errorResponse(mockRes, "Server error", "SERVER_ERROR");

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error",
        error: {
          code: "SERVER_ERROR",
          details: {},
        },
      });
    });

    it("should return error response with custom status code", () => {
      errorResponse(mockRes, "Not found", "NOT_FOUND", {}, 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
        error: {
          code: "NOT_FOUND",
          details: {},
        },
      });
    });

    it("should include error details", () => {
      errorResponse(
        mockRes,
        "Validation error",
        "VALIDATION_ERROR",
        { field: "email", issue: "invalid format" },
        400
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: {
          code: "VALIDATION_ERROR",
          details: { field: "email", issue: "invalid format" },
        },
      });
    });
  });
});
