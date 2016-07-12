import { Http, ConnectionBackend, BaseRequestOptions, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { provide } from '@angular/core';


export function getHttpMockServices() {
  return [
    BaseRequestOptions,
    MockBackend,
    provide(Http, {
      useFactory:
      (backend: ConnectionBackend, defaultOptions: BaseRequestOptions) => {
        return new Http(backend, defaultOptions);
      },
      deps: [MockBackend, BaseRequestOptions]
    })
  ];
}

interface FakeConnection {
  expectedUrl: string;
  expectedBody: Object;
  fakeResponseBody: Object;
}
export function setupFakeConnection(mockBackend, ...fakeConnections: FakeConnection[]) {
  if (fakeConnections.length === 0) { return; }
  let count = 0;
  mockBackend.connections.subscribe((conn: MockConnection) => {
      if (fakeConnections[count].expectedUrl) {
        expect(conn.request.url).toEqual(fakeConnections[count].expectedUrl);
      }
      if (fakeConnections[count].expectedBody) {
        let expectedBody = fakeConnections[count].expectedBody;
        expect(conn.request.text()).toEqual(JSON.stringify(expectedBody));
      }
      if (fakeConnections[count].fakeResponseBody) {
        const responseOptions = new ResponseOptions({
          body: fakeConnections[count].fakeResponseBody
        });
        conn.mockRespond(new Response(responseOptions));
      }
      count = Math.min(count + 1, fakeConnections.length);
  });
}
