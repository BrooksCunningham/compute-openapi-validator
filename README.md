# compute-openapi-validator
 validate requests against an openapi document. This repo uses the pet store openapi example, https://petstore3.swagger.io/

## Getting started
Clone the repo.
Use the Fastly cli to test locally and then deploy a service

## TODOs

| Request  | Status | Notes |
| :------------- | :----------: | -----------: |
| Allow for a seperate openapi spec file to be referenced within the src so that index.js will be smaller and easier to manage | Done | |
| Use req.headers in the validation | Done | |
| Use query params in the validation | Done | |
| Use request body in the validation | Done | |
