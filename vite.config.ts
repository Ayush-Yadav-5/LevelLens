import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  }

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'gemini-dev-proxy',
        configureServer(server: any) {
          server.middlewares.use('/api/gemini', async (req: any, res: any) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = body ? JSON.parse(body) : {};
                const { default: handler } = await import('./api/gemini.ts');
                
                const mockRes = {
                  setHeader: (k: string, v: string) => res.setHeader(k, v),
                  status: (code: number) => {
                    res.statusCode = code;
                    return {
                      json: (data: any) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                      }
                    };
                  }
                };

                await handler({ method: 'POST', body: parsed }, mockRes);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Gemini Dev Server Error' }));
              }
            });
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
