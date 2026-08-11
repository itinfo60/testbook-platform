import re

file_path = '/Users/balveerchoudhary/testbook-platform/client/src/features/home/pages/EduPortalHome.jsx'
with open(file_path, 'r') as f:
    content = f.read()

content = content.replace(
    "import { EDU_PORTAL_DATA } from '@/data/eduPortalData';",
    "import api, { blogAPI, examCategoryAPI, courseAPI, testAPI } from '@/services/api';"
)

old_state = """export default function EduPortalHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExamTab, setActiveExamTab] = useState('all');
  const [activeFreeTab, setActiveFreeTab] = useState('all');"""

new_state = """export default function EduPortalHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [freeResources, setFreeResources] = useState([]);
  const [testSeries, setTestSeries] = useState([]);
  const [articles, setArticles] = useState([]);
  const [demoLectures, setDemoLectures] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          alertsRes,
          categoriesRes,
          coursesRes,
          libraryRes,
          testsRes,
          articlesRes,
        ] = await Promise.all([
          api.get('/blogs', { params: { type: 'job_alert', status: 'published', limit: 5 } }).catch(() => ({ data: { data: [] } })),
          examCategoryAPI.getAll().catch(() => ({ data: { data: [] } })),
          courseAPI.getAll({ limit: 6, sort: 'popular' }).catch(() => ({ data: { data: [] } })),
          api.get('/library', { params: { accessLevel: 'all', limit: 6 } }).catch(() => ({ data: { data: [] } })),
          api.get('/tests', { params: { isPublished: true, limit: 4 } }).catch(() => ({ data: { data: [] } })),
          api.get('/blogs', { params: { type: 'article', status: 'published', limit: 3 } }).catch(() => ({ data: { data: [] } })),
        ]);

        setAlerts(alertsRes.data?.data?.blogs || alertsRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
        setTopCourses(coursesRes.data?.data?.courses || coursesRes.data?.data || []);
        setFreeResources(libraryRes.data?.data?.resources || libraryRes.data?.data || []);
        setTestSeries(testsRes.data?.data?.tests || testsRes.data?.data || []);
        setArticles(articlesRes.data?.data?.blogs || articlesRes.data?.data || []);
        
        const fetchedCourses = coursesRes.data?.data?.courses || coursesRes.data?.data || [];
        setDemoLectures(fetchedCourses.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch home data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);"""

content = content.replace(old_state, new_state)
content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';")

content = content.replace("EDU_PORTAL_DATA.trendingAlerts.map((alert)", "(alerts.length > 0 ? alerts : []).map((alert)")
content = content.replace("key={alert.id}", "key={alert._id || alert.id || Math.random()}")
content = content.replace("{alert.date}", "{new Date(alert.createdAt || alert.date || Date.now()).toLocaleDateString()}")

content = content.replace("EDU_PORTAL_DATA.examCategories.map((category)", "(categories.length > 0 ? categories : []).map((category)")
content = content.replace("key={category.id}", "key={category._id || category.id || Math.random()}")
content = content.replace("{category.badge}", "{category.badge || 'Category'}")
content = content.replace("{category.title}", "{category.name || category.title}")
content = content.replace("{category.subtitle}", "{category.description || category.subtitle || 'Explore our courses'}")
content = content.replace("category.exams.map((exam)", "(category.exams || []).map((exam)")
content = content.replace("key={exam.id}", "key={exam._id || exam.id || Math.random()}")
content = content.replace("{exam.icon}", "{exam.icon || '📝'}")
content = content.replace("{exam.tag}", "{exam.tag || 'Exam'}")
content = content.replace("{exam.name}", "{exam.name || exam.title}")
content = content.replace("{exam.detail}", "{exam.description || exam.detail}")
content = content.replace("{exam.totalTests}", "{exam.totalTests || '10+ Tests'}")
content = content.replace("search=${encodeURIComponent(exam.name)}", "search=${encodeURIComponent(exam.name || exam.title || '')}")

content = content.replace("EDU_PORTAL_DATA.freeResources.map((res)", "(freeResources.length > 0 ? freeResources : []).map((res)")
content = content.replace("key={res.id}", "key={res._id || res.id || Math.random()}")
content = content.replace("{res.icon}", "{res.icon || '📚'}")
content = content.replace("{res.tag}", "{res.tag || 'Free'}")
content = content.replace("{res.title}", "{res.title || res.name}")
content = content.replace("{res.desc}", "{res.description || res.desc}")
content = content.replace("{res.count}", "{res.count || 'Available'}")

content = content.replace("EDU_PORTAL_DATA.paidCoursesHighlights.map((course)", "(topCourses.length > 0 ? topCourses : []).map((course)")
content = content.replace("key={course.id}", "key={course._id || course.id || Math.random()}")
content = content.replace("{course.badge}", "{course.badge || 'Premium'}")
content = content.replace("{course.rating}", "{course.rating || '4.5'}")
content = content.replace("{course.studentsCount}", "{course.enrolledCount || course.studentsCount || 0}")
content = content.replace("{course.category}", "{course.category?.name || course.category || 'Course'}")
content = content.replace("course.features.map((feat, idx)", "(course.features || ['Live Classes', 'Notes', 'Mock Tests']).map((feat, idx)")
content = content.replace("{course.originalPrice}", "{course.price || 999}")
content = content.replace("{course.price}", "{course.salePrice || course.price || 499}")

content = content.replace("EDU_PORTAL_DATA.demoLectures.map((demo)", "(demoLectures.length > 0 ? demoLectures : []).map((demo)")
content = content.replace("key={demo.id}", "key={demo._id || demo.id || Math.random()}")
content = content.replace("src={demo.thumbnail}", "src={demo.thumbnail || 'https://via.placeholder.com/300x170?text=Demo+Class'}")
content = content.replace("alt={demo.title}", "alt={demo.title || 'Demo Class'}")
content = content.replace("{demo.duration}", "{demo.duration || '45:00'}")
content = content.replace("{demo.title}", "{demo.title || 'Demo Lecture'}")
content = content.replace("{demo.teacher}", "{demo.teacher?.name || demo.teacher || 'Expert Faculty'}")
content = content.replace("{demo.views}", "{demo.views || '1K+'}")

content = re.sub(r'\[\s*\{\s*title:\s*\'📋 Subject-Wise Tests\'[\s\S]*?\]\.map\(\(feature,\s*idx\)\s*=>', '(testSeries.length > 0 ? testSeries : []).map((feature, idx) =>', content)
content = content.replace("{feature.icon}", "{feature.icon || '📝'}")
content = content.replace("{feature.badge}", "{feature.category?.name || feature.category || 'Test'}")
content = content.replace("{feature.title}", "{feature.title || feature.name}")
content = content.replace("{feature.desc}", "{feature.description || feature.desc}")

content = content.replace("EDU_PORTAL_DATA.blogs.map((blog)", "(articles.length > 0 ? articles : []).map((blog)")
content = content.replace("key={blog.id}", "key={blog._id || blog.id || Math.random()}")
content = content.replace("{blog.category}", "{blog.category?.name || blog.category || 'Article'}")
content = content.replace("{blog.readTime}", "{blog.readTime || '5 min read'}")
content = content.replace("{blog.snippet}", "{blog.snippet || blog.excerpt || (blog.content ? blog.content.substring(0, 100) : 'Read more about this article...')}")
content = content.replace("{blog.date}", "{new Date(blog.createdAt || blog.date || Date.now()).toLocaleDateString()}")

with open(file_path, 'w') as f:
    f.write(content)
print("Updated via python")
