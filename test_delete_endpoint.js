async function test() {
  try {
    const delRes = await fetch(`http://localhost:3000/posts/some-fake-id`, {
      method: 'DELETE'
    });
    console.log('Status:', delRes.status);
    const data = await delRes.text();
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
