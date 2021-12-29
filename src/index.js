//! Default Compute@Edge template program.
import welcomePage from "./welcome-to-compute@edge.html";

// https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#class-openapibackend
// import { OpenAPIBackend } from 'openapi-backend';

// https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#class-openapivalidator
import { OpenAPIValidator } from 'openapi-backend/validation';


// https://petstore3.swagger.io/api/v3/openapi.yaml
const openapi_document = require("./petstore.json");

// https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#class-openapirouter
// import { OpenAPIRouter } from 'openapi-backend/router';


// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It could be
// used to route based on the request properties (such as method or path), send
// the request to a backend, make completely new requests, and/or generate
// synthetic responses.

const petstore_basic_document = {
  openapi: '3.0.1',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  paths: {
    '/pets': {
      get: {
        operationId: 'getPets',
        responses: {
          200: { description: 'ok' },
        },
      },
    },
    '/pets/{id}': {
      get: {
        operationId: 'getPetById',
        responses: {
          200: { description: 'ok' },
        },
      },
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
          },
        },
      ],
    },
  },
};

const validator = new OpenAPIValidator({
  definition: petstore_basic_document,
});

// validates HTTP requests against the spec defined in the OpenAPI validator object.
async function openapi_request_validation(req) {
  try {
    // console.log(req.method);
    let url = new URL(req.url);
    // console.log(url.pathname);
    // console.log(JSON.stringify(req.headers));
    let valid = validator.validateRequest(
      {
        // HTTP method of the request
        method: req.method,
        // path of the request
        path: url.pathname,
        // HTTP request headers
        headers: { 'accept': 'application/json', 'cookie': 'sessionid=abc123;' },
        // parsed query parameters (optional), we also parse query params from the path property
        // query: { 'format': 'json' }
        // the request body (optional), either raw buffer/string or a parsed object/array
        // body: { treat: 'bone' },
      }
    );
    console.log(JSON.stringify(valid));
    if (valid.valid) {
      // console.log("request is valid");
      return true
    };
  } catch (error) {
    // console.log(error);
    return false
  }
}


addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  // Get the client request.
  let req = event.request;

  // Filter requests that have unexpected methods.
  if (!["HEAD", "GET"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }

  let url = new URL(req.url);

  // If request is to the `/` path...
  if (url.pathname == "/") {
    // Head to https://developer.fastly.com/learning/compute/javascript/ to discover more.

    // Send a default synthetic response.
    return new Response(welcomePage, {
      status: 200,
      headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
    });

  }
  // Catch all other requests and return a 200 for pet store testing.
  if (url.pathname != "/") {
    let validation_result = await openapi_request_validation(req);
    console.log("validation results");
    console.log(validation_result);

    if (validation_result){
      console.log("valid: true");
      return new Response("Requests for pet store", {
        status: 200,
      });
    } else {
      console.log("valid: false");
      return new Response("Invalid request compared against openapi spec", {
        status: 500,
      });
    }


  }
}
