import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const redirect = request.query.redirect;
    
    // Si hay una URL de redirección, la pasamos como 'state' a Google
    // Google nos la devolverá intacta en el callback.
    if (redirect) {
      return {
        state: redirect,
      };
    }
    
    return {};
  }
}
