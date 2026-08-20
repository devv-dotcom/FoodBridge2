const pool = require('../config/database');

module.exports = {
  async overview() {
    const [[meals], [businesses], [ngos], [volunteers], [growth], [categories], [cities], [monthly]] = await Promise.all([
      pool.execute("SELECT COALESCE(SUM(number_of_meals), 0) AS meals_rescued FROM donations WHERE deleted_at IS NULL AND status IN ('delivered', 'completed')"),
      pool.execute("SELECT u.id, COALESCE(u.business_name, u.full_name) AS name, COUNT(d.id) AS donations, COALESCE(SUM(d.number_of_meals), 0) AS meals FROM users u LEFT JOIN donations d ON d.business_user_id = u.id AND d.deleted_at IS NULL WHERE u.role IN ('restaurant', 'hotel', 'bakery', 'supermarket', 'catering', 'marriage_hall') GROUP BY u.id ORDER BY donations DESC LIMIT 5"),
      pool.execute("SELECT n.id, n.ngo_name AS name, COUNT(ad.id) AS accepted_donations FROM ngos n LEFT JOIN accepted_donations ad ON ad.ngo_id = n.id GROUP BY n.id ORDER BY accepted_donations DESC LIMIT 5"),
      pool.execute('SELECT v.id, u.full_name AS name, v.completed_deliveries, v.rating FROM volunteers v JOIN users u ON u.id = v.user_id ORDER BY v.completed_deliveries DESC, v.rating DESC LIMIT 5'),
      pool.execute("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS donations FROM donations WHERE deleted_at IS NULL AND created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY month ORDER BY month"),
      pool.execute('SELECT c.name, COUNT(d.id) AS donations FROM food_categories c LEFT JOIN donations d ON d.category_id = c.id AND d.deleted_at IS NULL GROUP BY c.id ORDER BY donations DESC'),
      pool.execute('SELECT u.city, COUNT(d.id) AS donations FROM donations d JOIN users u ON u.id = d.business_user_id WHERE d.deleted_at IS NULL GROUP BY u.city ORDER BY donations DESC LIMIT 10'),
      pool.execute("SELECT DATE_FORMAT(pr.created_at, '%Y-%m') AS month, SUM(pr.status = 'completed') AS completed, SUM(pr.status = 'cancelled') AS cancelled FROM pickup_requests pr WHERE pr.created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY month ORDER BY month")
    ]);
    return { mealsRescued: meals[0].meals_rescued, topBusinesses: businesses[0], topNgos: ngos[0], topVolunteers: volunteers[0], donationGrowth: growth[0], categoryDistribution: categories[0], cityWiseDonations: cities[0], monthlyPerformance: monthly[0] };
  }
};
