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
    const openapi_checking_req = new Request(req);

    let method = openapi_checking_req.method
    let url = new URL(openapi_checking_req.url);
    let headers = Object.fromEntries(openapi_checking_req.headers.entries());
    // console.log(JSON.stringify(headers));
    let query = Object.fromEntries(url.searchParams.entries());
    // console.log(JSON.stringify(query));
    let body = await openapi_checking_req.text();
    // console.log(body);
    // console.log(JSON.stringify(body));

    let valid = openapi_validator.validateRequest(
      {
        // HTTP method of the request
        method: method,
        // path of the request
        path: url.pathname,
        // HTTP request 
        // headers: { 'accept': 'application/json', 'cookie': 'sessionid=abc123;' },
        headers: headers,
        // parsed query parameters (optional), we also parse query params from the path property
        // query: { 'format': 'json' }
        query: query,
        // the request body (optional), either raw buffer/string or a parsed object/array
        // body: { treat: 'bone' },
        body: body,
      }
    );
    // print the result to the console for debugging
    // console.log(JSON.stringify(valid));

    if (valid.valid) {
      console.log("request_valid: true");
      return valid
    };
    if (!valid.valid) {
      console.log("request_valid: false");
      return valid
    };
  } catch (error) {
    console.log(error);
    console.log("validation error")
    return error
  }
}
async function openapi_request_header_enrichment(req, openapi_validation_result){
  req.headers.set("host", "petstore3.swagger.io");
  req.headers.set("openapi-check", openapi_validation_result.valid);
  if (openapi_validation_result.errors){
    req.headers.set("openapi-check-false-debug", JSON.stringify(openapi_validation_result.errors));
  };
  return req
}


addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  // Get the client request.
  let original_req = event.request;



  const original_body = await original_req.text();
  let original_headers = new Headers();

  for (let pair of original_req.headers.entries()) {
    // console.log(pair[0]+ ': '+ pair[1]);
    original_headers.append(pair[0], pair[1]);
  };
 
  // Object.fromEntries(req.headers.entries())
  console.log(original_body);
  console.log(typeof original_body);
  // let body_init = new body_init(original_body);

  const original_req_init = {
    method: original_req.method,
    headers: original_headers,
    // body: original_body,
    body: 'my body',
  };

  // cloning is needed when we consume the body of the request
  // clone the original request to send to the origin.
  let req = new Request(original_req.url, original_req_init);


  // clone the request for the openapi check
  let openapi_check_req = new Request(original_req.url, original_req_init);  

  console.log(JSON.stringify(Object.fromEntries(req.headers.entries())));

  //debug at the anything endpoint for httpbin
  // console.log(req.headers.get('anything'));
  if (req.headers.get('anything') != null) {
    console.log('sending to httpbin');
    let validation_result = await openapi_request_validation(openapi_check_req);
    // console.log(JSON.stringify(validation_result));


    req = await openapi_request_header_enrichment(req, validation_result);

    let url = new URL(req.url);
    // Create a new Request object with an updated URL that will be send to httpbin.
    let new_url = new URL(url);
    new_url.pathname = "/anything" + url.pathname;

    const httpbin_req = new Request(new_url, req);
    // return fetch(req, {
    //   backend: httpbin_backend,
    // });

    return fetch(httpbin_req, {
      backend: httpbin_backend,
    });
    
  } else {
  // send requests to the petstore3 example
    console.log('sending to petstore origin');
    let validation_result = await openapi_request_validation(req);

    console.log("validation results: " + validation_result.valid);

    req.headers.set("host", "petstore3.swagger.io");
    // req.headers.set("openapi-check", validation_result);
    return fetch(req, {
      backend: petstore_backend,
    });
  }
}
