# Informe de Migración: De LocalStorage a Cookies (JWT)


## 1. ¿Por qué es inseguro almacenar JWT en localStorage?

El problema principal de `localStorage` es que es accesible por cualquier script que se ejecute en el navegador (es "JS-friendly"). Si nuestra página tiene una vulnerabilidad de **XSS (Cross-Site Scripting)** —por ejemplo, a través de un comentario malicioso o una librería externa infectada—, un atacante puede ejecutar una línea de código como `localStorage.getItem('token')` y enviarlo a su propio servidor. Una vez que tienen el token, pueden suplantar la identidad del usuario sin que este se dé cuenta.

## 2. ¿Cómo mejoran las cookies la seguridad del token?

Las cookies ofrecen una capa de protección llamada **`httpOnly`**. Al activar esta bandera desde el servidor, el navegador guarda el token pero **prohíbe estrictamente** que cualquier código JavaScript lo lea o lo manipule. 



Incluso si un atacante logra inyectar código malicioso (XSS), no podrá "robar" el token porque el navegador no se lo permitirá. El token solo viaja de forma automática en las cabeceras HTTP entre el cliente y el servidor.

## 3. ¿Qué nuevos desafíos introducen las cookies (CSRF)?

Al automatizar el envío del token, surge el riesgo de **CSRF (Cross-Site Request Forgery)**. Esto ocurre porque el navegador envía la cookie en *todas* las peticiones al dominio, incluso si la petición fue iniciada desde un sitio web malicioso mientras el usuario tiene su sesión abierta. 

Para mitigar esto en esta implementación, hemos configurado la cookie con `sameSite: 'lax'` (o `'strict'`), lo que le dice al navegador que no envíe la cookie si la petición proviene de un sitio externo, asegurando que las acciones solo se realicen si el usuario interactúa directamente con nuestra aplicación.

## 4. ¿Qué significa la configuración `httpOnly`?

Es una instrucción de seguridad que el servidor envía en la cabecera `Set-Cookie`. Le indica al navegador que la cookie es "invisible" para el motor de JavaScript. Solo puede ser accedida por el navegador para incluirla en las peticiones HTTP/HTTPS. Es la defensa número uno contra el robo de sesiones en aplicaciones web modernas.

