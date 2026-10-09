import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/api/app.js';

describe('demo page', () => {
  it('renders a browser dashboard for local AWS practice', async () => {
    const response = await request(createApp()).get('/').expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('AWS SDET Practice');
    expect(response.text).toContain('Create order');
    expect(response.text).toContain('Run worker once');
    expect(response.text).toContain('DynamoDB');
    expect(response.text).toContain('S3');
  });
});
