'use strict';

var errorSpec = [{
  name: 'CONNECTION_ERROR',
  message: 'Explorer service connection error.'
}, {
  name: 'NOT_FOUND',
  message: 'Not found.'
}, {
  name: 'UNAUTHORIZED',
  message: 'Unauthorized.'
}, {
  name: 'ECONNRESET_ERROR',
  message: 'ECONNRESET, body: {0}'
}, {
  name: 'INTERNAL_ERROR',
  message: 'Internal error: {0}'
}];

module.exports = errorSpec;
