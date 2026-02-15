import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;

@service(#{
  title: "Repo API",
})
namespace RepoApi;

// --- Models ---

model HealthResponse {
  status: "ok" | "error";
}

model User {
  id: string;
  email: string;
  name: string;
}

model ErrorResponse {
  @statusCode statusCode: 500;
  error: string;
}

// --- Routes ---

@route("/health")
namespace Health {
  @get op check(): HealthResponse;
}
