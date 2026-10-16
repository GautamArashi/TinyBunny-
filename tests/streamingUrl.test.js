import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isValidStreamingUrl,
  extractStreamingUrl,
  safeHostname,
} from '../src/services/streaming.js'

test('isValidStreamingUrl validation suite', async (t) => {
  await t.test('accepts official TinyFish root and subdomains', () => {
    assert.equal(isValidStreamingUrl('https://tinyfish.ai'), true)
    assert.equal(isValidStreamingUrl('https://tinyfish.ai/stream/0'), true)
    assert.equal(isValidStreamingUrl('https://streaming.tinyfish.ai/run_123'), true)
    assert.equal(isValidStreamingUrl('https://agent.tinyfish.ai/live/abc'), true)
  })

  await t.test('accepts official TinyFish Unikraft streaming microVM domains', () => {
    assert.equal(
      isValidStreamingUrl('https://tf-run_123.fra0-tinyfish.unikraft.app/stream/0'),
      true
    )
    assert.equal(
      isValidStreamingUrl('https://tf-abc.us-east-tinyfish.unikraft.app/stream/1'),
      true
    )
    assert.equal(isValidStreamingUrl('https://live-tinyfish.unikraft.app/stream'), true)
  })

  await t.test('accepts verified browser infrastructure partner domains', () => {
    assert.equal(isValidStreamingUrl('https://browserbase.com/session/123'), true)
    assert.equal(isValidStreamingUrl('https://connect.browserbase.com/devtools'), true)
    assert.equal(isValidStreamingUrl('https://steel.dev/session/456'), true)
    assert.equal(isValidStreamingUrl('https://hyperbeam.com/stream/789'), true)
  })

  await t.test('accepts localhost and 127.0.0.1 for local testing', () => {
    assert.equal(isValidStreamingUrl('http://localhost:5000/stream'), true)
    assert.equal(isValidStreamingUrl('https://localhost:3000/live'), true)
    assert.equal(isValidStreamingUrl('http://127.0.0.1:8080/preview'), true)
  })

  await t.test('rejects non-HTTPS external protocols', () => {
    assert.equal(isValidStreamingUrl('http://tinyfish.ai/stream'), false)
    assert.equal(isValidStreamingUrl('http://tf-123.unikraft.app/stream'), false)
    assert.equal(isValidStreamingUrl('javascript:alert(1)'), false)
    assert.equal(isValidStreamingUrl('data:text/html,<div>test</div>'), false)
    assert.equal(isValidStreamingUrl('ftp://tinyfish.ai/stream'), false)
  })

  await t.test('rejects untrusted domains', () => {
    assert.equal(isValidStreamingUrl('https://evil-site.com/stream'), false)
    assert.equal(isValidStreamingUrl('https://phishing-tinyfish.com/stream'), false)
    assert.equal(isValidStreamingUrl('https://unikraft.fake.org'), false)
  })

  await t.test('rejects status messages and malformed input', () => {
    assert.equal(isValidStreamingUrl(null), false)
    assert.equal(isValidStreamingUrl(undefined), false)
    assert.equal(isValidStreamingUrl(''), false)
    assert.equal(isValidStreamingUrl('   '), false)
    assert.equal(isValidStreamingUrl('Live browser stream ready'), false)
    assert.equal(isValidStreamingUrl('Awaiting live streaming browser URL'), false)
    assert.equal(isValidStreamingUrl('{"type":"STREAMING_URL"}'), false)
  })
})

test('Streaming URL extraction candidate logic', async (t) => {
  await t.test('extracts from production TinyFish streaming_url property', () => {
    const payload = {
      type: 'STREAMING_URL',
      run_id: 'run_abc',
      streaming_url: 'https://tf-run_abc.fra0-tinyfish.unikraft.app/stream/0',
    }
    const extracted = extractStreamingUrl(payload)
    assert.equal(extracted, 'https://tf-run_abc.fra0-tinyfish.unikraft.app/stream/0')
    assert.equal(isValidStreamingUrl(extracted), true)
  })

  await t.test('extracts from fallback url property', () => {
    const payload = {
      type: 'STREAMING_URL',
      url: 'https://streaming.tinyfish.ai/run_123',
    }
    const extracted = extractStreamingUrl(payload)
    assert.equal(extracted, 'https://streaming.tinyfish.ai/run_123')
    assert.equal(isValidStreamingUrl(extracted), true)
  })

  await t.test('ignores status messages in data.message and status strings', () => {
    const payload = {
      type: 'STREAMING_URL',
      message: 'Live stream initializing',
    }
    const extracted = extractStreamingUrl(payload)
    assert.equal(extracted, null)
  })

  await t.test('handles string URLs directly', () => {
    const raw = 'https://tf-123.fra0-tinyfish.unikraft.app/stream/0'
    const extracted = extractStreamingUrl(raw)
    assert.equal(extracted, 'https://tf-123.fra0-tinyfish.unikraft.app/stream/0')
    assert.equal(isValidStreamingUrl(extracted), true)
  })
})

test('safeHostname utility', async (t) => {
  await t.test('extracts hostname safely', () => {
    assert.equal(
      safeHostname('https://tf-run_123.fra0-tinyfish.unikraft.app/stream/0'),
      'tf-run_123.fra0-tinyfish.unikraft.app'
    )
    assert.equal(safeHostname('https://tinyfish.ai/test'), 'tinyfish.ai')
    assert.equal(safeHostname(null), 'No preview session')
    assert.equal(safeHostname(''), 'No preview session')
  })
})
