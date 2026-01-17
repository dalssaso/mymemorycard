import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../backend/openapi.json',
  output: {
    path: 'src/shared/api/generated',
    format: 'prettier',
  },
  plugins: ['@hey-api/client-axios', '@hey-api/sdk', '@hey-api/typescript'],
})
