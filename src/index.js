//! Default Compute@Edge template program.
import welcomePage from "./welcome-to-compute@edge.html";

// https://petstore3.swagger.io
const petstore_backend = "petstore";
const httpbin_backend = "httpbin";

// https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#class-openapibackend
// import { OpenAPIBackend } from 'openapi-backend';

// https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#class-openapivalidator
import { OpenAPIValidator } from 'openapi-backend/validation';

// https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#class-openapirouter
import { OpenAPIRouter } from 'openapi-backend/router';

// https://petstore3.swagger.io/api/v3/openapi.yaml
// const openapi_document = require("./petstore.json");
// set the yaml or JSON files that are used for the openapi spec.
const openapi_document = require("./petstore.yaml");
const petstore_basic_document = require("./petstore-basic.json");

const openapi_router = new OpenAPIRouter({
  definition: openapi_document,
  apiRoot: '/api/v3',
  ignoreTrailingSlashes: true,
});

// lazyCompileValidator is needed for $ref to work.
const openapi_validator = new OpenAPIValidator({
  definition: openapi_document,
  lazyCompileValidators: true,
  router: openapi_router,
});


const openapi_basic_validator = new OpenAPIValidator({
  definition: petstore_basic_document,
});

// validates HTTP requests against the spec defined in the OpenAPI validator object.
async function openapi_request_validation(req) {
  try {
    // console.log(req.method);
    let url = new URL(req.url);

    let headers = req.headers;
    console.log(JSON.stringify(headers));

    let body = req.text();
    console.log(JSON.stringify(body));
    // I am having trouble getting the headers out of a given request.

    // https://developer.fastly.com/learning/compute/migrate/#sort-and-sanitize-a-query-string
    // let searchEntries = url.searchParams.entries();
    // let filteredEntries = searchEntries.filter();
    // let filteredParams = new URLSearchParams(filteredEntries);
    // console.log(filteredParams.sort());

    let valid = openapi_validator.validateRequest(
      {
        // HTTP method of the request
        method: req.method,
        // path of the request
        path: url.pathname,
        // HTTP request 
        // headers: { 'accept': 'application/json', 'cookie': 'sessionid=abc123;' },
        headers: req.headers,
        // parsed query parameters (optional), we also parse query params from the path property
        // query: { 'format': 'json' }
        // the request body (optional), either raw buffer/string or a parsed object/array
        // body: { treat: 'bone' },
        body: req.body
      }
    );
    // print the result to the console for debugging
    console.log(JSON.stringify(valid));

    if (valid.valid) {
      console.log("request_valid: true");
      return valid
    };
    if (!valid.valid) {
      console.log("request_valid: false");
      return valid
    };
  } catch (error) {
    console.log("validation error")
    // console.log(error);
    return error
  }
}


addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  // Get the client request.
  let req = event.request;

  let url = new URL(req.url);

  //debug at the anything endpoint for httpbin
  if (req.headers.get("anything")) {
    let validation_result = await openapi_request_validation(req);
    // console.log(JSON.stringify(validation_result));

    req.headers.set("host", "petstore3.swagger.io");
    req.headers.set("openapi-check", validation_result.valid);
    if (validation_result.errors){
      req.headers.set("openapi-check-false-debug", JSON.stringify(validation_result.errors));
    };

    // Create a new Request object with an updated URL that will be send to httpbin.
    let new_url = new URL(url);
    new_url.pathname = "/anything" + url.pathname;

    const httpbin_req = new Request(new_url, req);

    return fetch(httpbin_req, {
      backend: httpbin_backend,
    });
  } else {
  // send requests to the petstore3 example
    let validation_result = await openapi_request_validation(req);

    console.log("validation results: " + validation_result.valid);

    req.headers.set("host", "petstore3.swagger.io");
    // req.headers.set("openapi-check", validation_result);
    return fetch(req, {
      backend: petstore_backend,
    });
  }
}
