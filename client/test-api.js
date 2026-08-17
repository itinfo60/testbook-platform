const axios = require('axios');
async function test() {
  try {
    const res1 = await axios.get('http://localhost:5000/api/v1/blogs?limit=3');
    console.log('Blogs Data:', res1.data.data);

    const res2 = await axios.get('http://localhost:5000/api/v1/courses?limit=4&isPublished=true');
    console.log('Courses Data:', res2.data.data);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
