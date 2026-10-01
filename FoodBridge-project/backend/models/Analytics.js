const pool = require('../config/database');

module.exports = {
  async overview() {
    const [[meals], [businesses], [ngos], [volunteers], [growth], [categories], [cities], [monthly], [liveStatus]] = await Promise.all([
      pool.execute("SELECT COALESCE(SUM(number_of_meals), 0) AS meals_rescued FROM donations WHERE deleted_at IS NULL AND status IN ('delivered', 'completed')"),
      pool.execute("SELECT u.id, COALESCE(u.business_name, u.full_name) AS name, COUNT(d.id) AS donations, COALESCE(SUM(d.number_of_meals), 0) AS meals FROM users u LEFT JOIN donations d ON d.business_user_id = u.id AND d.deleted_at IS NULL WHERE u.role IN ('restaurant', 'hotel', 'bakery', 'supermarket', 'catering', 'marriage_hall') GROUP BY u.id ORDER BY donations DESC LIMIT 5"),
      pool.execute("SELECT n.id, n.ngo_name AS name, COUNT(ad.id) AS accepted_donations FROM ngos n LEFT JOIN accepted_donations ad ON ad.ngo_id = n.id GROUP BY n.id ORDER BY accepted_donations DESC LIMIT 5"),
      pool.execute('SELECT v.id, u.full_name AS name, v.completed_deliveries, v.rating FROM volunteers v JOIN users u ON u.id = v.user_id ORDER BY v.completed_deliveries DESC, v.rating DESC LIMIT 5'),
      pool.execute("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS donations FROM donations WHERE deleted_at IS NULL AND created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY month ORDER BY month"),
      pool.execute('SELECT c.name, COUNT(d.id) AS donations FROM food_categories c LEFT JOIN donations d ON d.category_id = c.id AND d.deleted_at IS NULL GROUP BY c.id ORDER BY donations DESC'),
      pool.execute('SELECT u.city, COUNT(d.id) AS donations FROM donations d JOIN users u ON u.id = d.business_user_id WHERE d.deleted_at IS NULL GROUP BY u.city ORDER BY donations DESC LIMIT 10'),
      pool.execute("SELECT DATE_FORMAT(pr.created_at, '%Y-%m') AS month, SUM(pr.status = 'completed') AS completed, SUM(pr.status = 'cancelled') AS cancelled FROM pickup_requests pr WHERE pr.created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY month ORDER BY month"),
      pool.execute(`
        SELECT 
          SUM(status = 'available' AND (is_emergency = TRUE OR expiry_time <= DATE_ADD(NOW(), INTERVAL 2 HOUR))) AS urgent_donations,
          SUM(status = 'available') AS available_donations,
          SUM(status IN ('accepted', 'volunteer_assigned', 'pickup_started', 'food_collected', 'on_the_way')) AS active_operations,
          SUM(status IN ('delivered', 'completed')) AS completed_donations
        FROM donations WHERE deleted_at IS NULL
      `)
    ]);

    const mealsNum = Number(meals[0]?.meals_rescued || 0);
    const kgSaved = Math.round(mealsNum * 0.45);
    const co2Kg = Math.round(kgSaved * 2.5);
    const co2Tons = Number((co2Kg / 1000).toFixed(1));
    const beneficiaries = Math.round(mealsNum * 1.2);
    const trees = Math.round(co2Kg / 21);

    return {
      mealsRescued: mealsNum,
      kgFoodSaved: kgSaved,
      co2AvoidedKg: co2Kg,
      co2AvoidedTons: co2Tons,
      beneficiariesReached: beneficiaries,
      treesEquivalent: trees,
      liveStatus: liveStatus[0],
      topBusinesses: businesses[0],
      topNgos: ngos[0],
      topVolunteers: volunteers[0],
      donationGrowth: growth[0],
      categoryDistribution: categories[0],
      cityWiseDonations: cities[0],
      monthlyPerformance: monthly[0]
    };
  },

  async publicSummary() {
    const [[metrics], [liveOps], [topDonors], [topVols]] = await Promise.all([
      pool.execute(`
        SELECT 
          COALESCE(SUM(number_of_meals), 0) AS meals_rescued,
          COUNT(*) AS total_donations
        FROM donations WHERE deleted_at IS NULL AND status IN ('delivered', 'completed')
      `),
      pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role IN ('restaurant', 'hotel', 'bakery', 'supermarket', 'catering', 'marriage_hall')) AS total_donors,
          (SELECT COUNT(*) FROM ngos WHERE account_status = 'active') AS total_ngos,
          (SELECT COUNT(*) FROM volunteers WHERE availability = 'online') AS active_volunteers,
          (SELECT COUNT(*) FROM donations WHERE status = 'available' AND deleted_at IS NULL) AS available_donations,
          (SELECT COUNT(*) FROM donations WHERE status = 'available' AND deleted_at IS NULL AND (is_emergency = TRUE OR expiry_time <= DATE_ADD(NOW(), INTERVAL 2 HOUR))) AS urgent_donations
      `),
      pool.execute(`
        SELECT COALESCE(u.business_name, u.full_name) AS name, u.city, COALESCE(SUM(d.number_of_meals), 0) AS meals
        FROM users u JOIN donations d ON d.business_user_id = u.id AND d.deleted_at IS NULL
        GROUP BY u.id ORDER BY meals DESC LIMIT 3
      `),
      pool.execute(`
        SELECT u.full_name AS name, u.city, v.completed_deliveries
        FROM volunteers v JOIN users u ON u.id = v.user_id
        ORDER BY v.completed_deliveries DESC LIMIT 3
      `)
    ]);

    const mealsNum = Number(metrics[0]?.meals_rescued || 0);
    const kgSaved = Math.round(mealsNum * 0.45);
    const co2Kg = Math.round(kgSaved * 2.5);
    const co2Tons = Number((co2Kg / 1000).toFixed(1));
    const beneficiaries = Math.round(mealsNum * 1.2);
    const trees = Math.round(co2Kg / 21);

    return {
      mealsRescued: mealsNum,
      kgFoodSaved: kgSaved,
      co2AvoidedKg: co2Kg,
      co2AvoidedTons: co2Tons,
      beneficiariesReached: beneficiaries,
      treesEquivalent: trees,
      totalDonations: metrics[0]?.total_donations || 0,
      activeVolunteers: liveOps[0]?.active_volunteers || 0,
      totalDonors: liveOps[0]?.total_donors || 0,
      totalNgos: liveOps[0]?.total_ngos || 0,
      availableDonations: liveOps[0]?.available_donations || 0,
      urgentDonations: liveOps[0]?.urgent_donations || 0,
      leaderboardPreview: {
        topDonors: topDonors[0],
        topVolunteers: topVols[0]
      }
    };
  },

  async mapData() {
    const [[donations], [ngos], [volunteers]] = await Promise.all([
      pool.execute(`
        SELECT d.id, d.food_name, d.quantity, d.number_of_meals, d.status, d.latitude, d.longitude, d.city, d.is_emergency, d.expiry_time,
               COALESCE(u.business_name, u.full_name) AS donor_name
        FROM donations d
        JOIN users u ON u.id = d.business_user_id
        WHERE d.deleted_at IS NULL AND d.status IN ('available', 'accepted', 'volunteer_assigned', 'pickup_started', 'food_collected')
      `),
      pool.execute(`
        SELECT n.id, n.ngo_name, u.city, u.latitude, u.longitude, u.address
        FROM ngos n
        JOIN users u ON u.id = n.user_id
        WHERE n.account_status = 'active'
      `),
      pool.execute(`
        SELECT v.id, u.full_name, u.city, u.latitude, u.longitude, v.vehicle_type, v.availability
        FROM volunteers v
        JOIN users u ON u.id = v.user_id
        WHERE v.availability = 'online'
      `)
    ]);

    const now = Date.now();
    const enrichedDonations = donations[0].map(d => {
      const expiry = new Date(d.expiry_time).getTime();
      const diffHours = (expiry - now) / 3600000;
      return {
        ...d,
        is_urgent: Boolean(d.is_emergency) || (diffHours <= 2.5 && diffHours > 0)
      };
    });

    return {
      donations: enrichedDonations,
      ngos: ngos[0],
      volunteers: volunteers[0]
    };
  }
};
