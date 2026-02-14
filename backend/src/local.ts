import 'dotenv/config';

import { createApp } from '@/app/createApp';

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? '3001');

const app = createApp();

app.listen(port, host, () => {
  console.log(`smart-exam backend listening on http://${host}:${port}`);
});
