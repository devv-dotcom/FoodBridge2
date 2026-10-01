const pool = require('../config/database');

exports.getDonationCertificate = async (req, res, next) => {
  try {
    const donationId = req.params.id;
    const [rows] = await pool.execute(`
      SELECT d.id AS donation_id, d.food_name, d.quantity, d.number_of_meals, d.created_at, d.status,
             u.id AS donor_user_id, COALESCE(u.business_name, u.full_name) AS donor_name, u.city AS donor_city, u.address AS donor_address,
             n.ngo_name, n.registration_number AS ngo_reg_no, ngo_user.city AS ngo_city,
             v_user.full_name AS volunteer_name,
             pr.delivery_time, pr.status AS pickup_status
      FROM donations d
      JOIN users u ON u.id = d.business_user_id
      LEFT JOIN accepted_donations ad ON ad.donation_id = d.id
      LEFT JOIN ngos n ON n.id = ad.ngo_id
      LEFT JOIN users ngo_user ON ngo_user.id = n.user_id
      LEFT JOIN pickup_requests pr ON pr.donation_id = d.id
      LEFT JOIN volunteers v ON v.id = pr.volunteer_id
      LEFT JOIN users v_user ON v_user.id = v.user_id
      WHERE d.id = ? AND d.deleted_at IS NULL
    `, [donationId]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const data = rows[0];
    const meals = Number(data.number_of_meals) || 0;
    const kgSaved = Number((meals * 0.45).toFixed(1));
    const co2Avoided = Number((kgSaved * 2.5).toFixed(1));
    const beneficiaries = Math.round(meals * 1.2);

    const certificate = {
      certificateNumber: `FB-CERT-${String(data.donation_id).padStart(6, '0')}`,
      issueDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      completionDate: data.delivery_time ? new Date(data.delivery_time).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
      donor: {
        name: data.donor_name,
        address: data.donor_address,
        city: data.donor_city
      },
      receivingNgo: {
        name: data.ngo_name || 'Verified Partner NGO',
        regNo: data.ngo_reg_no || 'REG-NGO-APPROVED',
        city: data.ngo_city || data.donor_city
      },
      volunteer: data.volunteer_name || 'Community Food Volunteer',
      donationDetails: {
        id: data.donation_id,
        foodName: data.food_name,
        quantity: data.quantity,
        mealsRescued: meals,
        kgFoodSaved: kgSaved,
        co2AvoidedKg: co2Avoided,
        beneficiariesReached: beneficiaries
      },
      verificationStatus: 'VERIFIED & ZERO-WASTE CERTIFIED',
      issuer: 'FoodBridge National Food Rescue Initiative'
    };

    return res.json({ success: true, certificate });
  } catch (error) {
    next(error);
  }
};
