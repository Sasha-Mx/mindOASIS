// Industry benchmarks for different student cohorts
// Scale: 0 = none, 1 = beginner, 2 = basic, 3 = intermediate, 4 = strong
const benchmarkData = {
  internship_beginner: {
    DSA: { avg: 1, top: 2 },
    OOP: { avg: 1, top: 2 },
    SQL: { avg: 0, top: 1 },
    SystemDesign: { avg: 0, top: 0 },
    Projects: { avg: 1, top: 2 }
  },
  internship_advanced: {
    DSA: { avg: 2, top: 3 },
    OOP: { avg: 2, top: 3 },
    SQL: { avg: 1, top: 2 },
    SystemDesign: { avg: 0, top: 1 },
    Projects: { avg: 2, top: 3 }
  },
  placement_service: {
    DSA: { avg: 2, top: 3 },
    OOP: { avg: 2, top: 3 },
    SQL: { avg: 2, top: 3 },
    SystemDesign: { avg: 1, top: 2 },
    Projects: { avg: 2, top: 3 }
  },
  placement_product: {
    DSA: { avg: 3, top: 4 },
    OOP: { avg: 3, top: 4 },
    SQL: { avg: 2, top: 3 },
    SystemDesign: { avg: 2, top: 3 },
    Projects: { avg: 3, top: 4 }
  }
};

module.exports = benchmarkData;
