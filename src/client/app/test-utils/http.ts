import { Http, ConnectionBackend, BaseRequestOptions, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';


export function getHttpMockServices() {
  return [
    BaseRequestOptions,
    MockBackend,
    {
      provide: Http,
      useFactory: (backend: ConnectionBackend, defaultOptions: BaseRequestOptions) => {
        return new Http(backend, defaultOptions);
      },
      deps: [MockBackend, BaseRequestOptions]
    }
  ];
}

interface FakeConnection {
  expectedUrl?: string;
  expectedBody?: Object;
  fakeResponseBody?: Object;
}
export function setupFakeConnection(mockBackend, ...fakeConnections: Array<FakeConnection>) {
  if (fakeConnections.length === 0) { return; }
  let count = 0;
  mockBackend.connections.subscribe((conn: MockConnection) => {
    testExpected(fakeConnections[count].expectedUrl, conn.request.url);
    if (conn.request.getBody() != null) {
      testExpected(fakeConnections[count].expectedBody, JSON.parse(conn.request.text()));
    }

    if (typeof fakeConnections[count].fakeResponseBody !== 'undefined') {
      const responseOptions = new ResponseOptions({
        body: fakeConnections[count].fakeResponseBody
      });
      conn.mockRespond(new Response(responseOptions));
    }
    count = Math.min(count + 1, fakeConnections.length);
  });
}

function testExpected(expected, actual) {
  if (typeof expected !== 'undefined') {
    expect(actual).toEqual(expected);
  }
}
