// Shared statistics data for landing page and public courses page
// This ensures data consistency across all public-facing pages

import { demoCourses, demoMaterials, demoAssignments } from './demoData';

// Calculate dynamic stats from demo data
const publishedCourses = demoCourses.filter(course => course.status === 'published');
const totalStudents = publishedCourses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0);
const totalMaterials = demoMaterials.length;
const totalAssignments = demoAssignments.filter(a => a.status === 'published').length;

export const sharedStats = {
  // Main hero stats
  activeStudents: totalStudents,
  activeStudentsDisplay: totalStudents >= 1000 ? `${Math.floor(totalStudents / 1000)}K+` : `${totalStudents}+`,
  
  schools: 500,
  schoolsDisplay: '500+',
  
  lessonsDelivered: totalMaterials * 1000, // Simulated lesson delivery count
  lessonsDeliveredDisplay: `${Math.floor(totalMaterials * 1000 / 1000)}K+`,
  
  // Live activity stats
  teachersOnline: 342,
  teachersOnlineDisplay: '342 active',
  
  assignmentsSubmittedToday: 2847,
  assignmentsSubmittedTodayDisplay: '2,847 today',
  
  // Course page stats
  publishedCoursesCount: publishedCourses.length,
  totalMaterials: totalMaterials,
};

export type SharedStats = typeof sharedStats;
