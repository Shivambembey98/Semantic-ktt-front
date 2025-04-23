import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { authInterceptor } from '../auth/auth-interceptor.service';

describe('authInterceptor', () => {
  it('should add Authorization header if token is present', (done) => {
    const mockRequest = new HttpRequest('GET', '/test-endpoint');
    const mockHandler: HttpHandlerFn = (req) => {
      expect(req.headers.has('Authorization')).toBeTrue();
      expect(req.headers.get('Authorization')).toBe('Bearer mock-token');
      done(); // ✅ Important for async tests
      return of({} as HttpEvent<any>);
    };

    localStorage.setItem('token', 'mock-token'); // ✅ Mock the token
    authInterceptor(mockRequest, mockHandler); // ✅ Call the interceptor
  });

  it('should not add Authorization header if token is missing', (done) => {
    const mockRequest = new HttpRequest('GET', '/test-endpoint');
    const mockHandler: HttpHandlerFn = (req) => {
      expect(req.headers.has('Authorization')).toBeFalse();
      done();
      return of({} as HttpEvent<any>);
    };

    localStorage.removeItem('token'); // ✅ No token in storage
    authInterceptor(mockRequest, mockHandler);
  });
});

