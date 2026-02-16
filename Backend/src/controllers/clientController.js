const Client = require("../models/Client");
const ExcelJS = require('exceljs');
const { sendCareerEmail } = require("../config/emailConfig");


exports.createClient = async (req, res) => {
  try {
 
    const clientData = {
      ...req.body,
      isNew: true,
      domainViewed: false,
      courseViewed: false,
      studentViewed: false,
      newAt: new Date()
    };
    
    const client = await Client.create(clientData);
    
    res.status(201).json({ 
      success: true, 
      client,
      message: "Client created successfully" 
    });

    console.log(` IMMEDIATE email sending started for: ${client.email}`);
    
    sendCareerEmail(
      client.email,
      client.fullName || "Client",
      client.phone || "Not provided",
      client.city || "Not specified",
      client.message || "Career guidance query"
    ).then(result => {
      const timestamp = new Date().toLocaleTimeString();
      if (result && result.success) {
        console.log(`[${timestamp}] Email SENT to ${client.email} (Message ID: ${result.messageId || 'N/A'})`);
      } else {
        console.log(`[${timestamp}] Email FAILED for ${client.email}: ${result?.error || 'Unknown error'}`);
      }
    }).catch(err => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(` [${timestamp}] Email ERROR: ${err.message}`);
    });

  } catch (error) {
    console.error(" Create client error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};


exports.getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // 🔥 SIRF 50 CLIENTS
    const skip = (page - 1) * limit;

    const clients = await Client.find()
      .select('fullName email phone domain course status createdAt newAt') // 🔥 SIRF JARURI FIELDS
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Client.countDocuments();

    res.json({ 
      success: true, 
      clients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalClients: total,
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    await client.deleteOne();
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   UPDATE CLIENT STATUS (Protected)
================================ */
exports.updateClientStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatus = ["new", "in-progress", "completed"];
  
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET CLIENTS BY CATEGORY (Protected)
================================ */
exports.getClientsByCategory = async (req, res) => {
  const { category } = req.params;
  const allowedCategories = [
    "Career Counselors",
    "Relationship Counselors",
    "Mental Health Counselors",
    "Educational Counselors",
  ];

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
  }

  try {
    const clients = await Client.find({ category }).sort({
      createdAt: -1,
    });

    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET CLIENTS BY DOMAIN (Protected)
================================ */
exports.getClientsByDomain = async (req, res) => {
  const { domain } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50; // 🔥 SIRF 50

  try {
    const clients = await Client.find({ domain })
      .select('fullName email phone course status createdAt newAt courseViewed') // 🔥 SIRF JARURI
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Client.countDocuments({ domain });

    res.status(200).json({
      success: true,
      total: clients.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      },
      data: clients
    });
  } catch (error) {
    console.error("Get clients by domain error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   EXPORT CLIENTS TO EXCEL (Protected)
================================ */
exports.exportClientsToExcel = async (req, res) => {
  try {
    console.log('Excel export request received');

    // 🔥 SIRF COUNT LE LO PEHLE
    const totalClients = await Client.countDocuments({});
    
    if (totalClients === 0) {
      return res.status(404).json({ success: false, message: "No clients found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students Data');

    // Columns define karo
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Domain', key: 'domain', width: 20 },
      { header: 'Course', key: 'course', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created Date', key: 'createdAt', width: 20 }
    ];

    // 🔥 BATCH PROCESSING - 500 records ek baar mein
    const BATCH_SIZE = 500;
    let skip = 0;
    let rowIndex = 1;

    while (skip < totalClients) {
      const clients = await Client.find({})
        .select('fullName email phone domain course status createdAt') // 🔥 SIRF JARURI FIELDS
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(BATCH_SIZE);

      clients.forEach((client, index) => {
        worksheet.addRow({
          sno: skip + index + 1,
          fullName: client.fullName || '-',
          email: client.email || '-',
          phone: client.phone || '-',
          domain: client.domain || '-',
          course: client.course || '-',
          status: client.status || 'new',
          createdAt: new Date(client.createdAt).toLocaleString('en-IN')
        });
      });

      skip += BATCH_SIZE;
      console.log(`Processed ${skip}/${totalClients} clients`);
    }

    // File send karo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Clients_Export.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

/* ===============================
   MARK DOMAIN AS VIEWED
================================ */
exports.markDomainAsViewed = async (req, res) => {
  try {
    const { domain } = req.params;
    
    // Update all students in this domain
    await Client.updateMany(
      { domain, domainViewed: false },
      { domainViewed: true }
    );

    res.status(200).json({
      success: true,
      message: "Domain marked as viewed"
    });

  } catch (error) {
    console.error("Mark domain as viewed error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   MARK COURSE AS VIEWED
================================ */
exports.markCourseAsViewed = async (req, res) => {
  try {
    const { course } = req.params;
    
    // Update all students in this course
    await Client.updateMany(
      { course, courseViewed: false },
      { courseViewed: true }
    );

    res.status(200).json({
      success: true,
      message: "Course marked as viewed"
    });

  } catch (error) {
    console.error("Mark course as viewed error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   MARK STUDENT AS VIEWED
================================ */
exports.markStudentAsViewed = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const client = await Client.findByIdAndUpdate(
      clientId,
      { 
        studentViewed: true,
        isNew: false 
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student marked as viewed"
    });

  } catch (error) {
    console.error("Mark student as viewed error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   GET DOMAIN STATS WITH NEW COUNT
================================ */
exports.getDomainStats = async (req, res) => {
  try {
    const domains = [
      "MEDICAL", "PHARMACY", "NURSING", "PARAMEDICAL",
      "ENGINEERING", "MANAGEMENT", "GRADUATION", 
      "POST GRADUATION", "VOCATIONAL", "LANGUAGES",
      "AGRICULTURE", "EDUCATION"
    ];

    const stats = [];
    
    for (const domain of domains) {
      const total = await Client.countDocuments({ domain });
      const newCount = await Client.countDocuments({ 
        domain, 
        domainViewed: false,
        newAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });
      const inProgress = await Client.countDocuments({ domain, status: 'in-progress' });
      const completed = await Client.countDocuments({ domain, status: 'completed' });
      
      stats.push({
        domain,
        total,
        new: newCount,
        inProgress,
        completed,
        hasNew: newCount > 0
      });
    }

    // Overall stats
    const totalStudents = await Client.countDocuments();
    const totalNew = await Client.countDocuments({ 
      domainViewed: false,
      newAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const totalInProgress = await Client.countDocuments({ status: 'in-progress' });
    const totalCompleted = await Client.countDocuments({ status: 'completed' });

    res.status(200).json({
      success: true,
      domainStats: stats,
      overallStats: {
        total: totalStudents,
        new: totalNew,
        inProgress: totalInProgress,
        completed: totalCompleted
      }
    });

  } catch (error) {
    console.error("Domain stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   GET COURSE STATS WITH NEW COUNT
================================ */
exports.getCourseStats = async (req, res) => {
  try {
    const { domain } = req.params;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is required"
      });
    }

    // Get all unique courses in this domain
    const courses = await Client.distinct("course", { domain });
    
    const courseStats = [];
    
    for (const course of courses) {
      if (course) {
        const total = await Client.countDocuments({ domain, course });
        const newCount = await Client.countDocuments({ 
          domain, 
          course, 
          courseViewed: false,
          newAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        courseStats.push({
          course,
          total,
          new: newCount,
          hasNew: newCount > 0
        });
      }
    }

    res.status(200).json({
      success: true,
      domain,
      courseStats
    });

  } catch (error) {
    console.error("Course stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   GET CLIENTS BY COURSE WITH VIEW STATUS
================================ */
exports.getClientsByCourse = async (req, res) => {
  try {
    const { course } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // 🔥 SIRF 50

    const clients = await Client.find({ course })
      .select('fullName email phone domain status createdAt newAt studentViewed') // 🔥 SIRF JARURI
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Client.countDocuments({ course });

    res.status(200).json({
      success: true,
      count: clients.length,
      course: course,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      },
      data: clients
    });
  } catch (error) {
    console.error("Get clients by course error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
/* ===============================
   GET CLIENTS BY DYNAMIC FILTER
================================ */
exports.getClientsByDynamicFilter = async (req, res) => {
  try {
    const { filterField, filterValue } = req.query;
    
    if (!filterField || !filterValue) {
      return res.status(400).json({
        success: false,
        message: "filterField and filterValue are required"
      });
    }

    const allowedFields = ["domain", "status", "eduLevel", "country", "state", "city", "course"];
    
    if (!allowedFields.includes(filterField)) {
      return res.status(400).json({
        success: false,
        message: `Invalid filter field. Allowed: ${allowedFields.join(', ')}`
      });
    }

    const query = {};
    query[filterField] = filterValue;

    const clients = await Client.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });

  } catch (error) {
    console.error("Dynamic filter error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   GET DASHBOARD STATS (NEW - COMBINED)
================================ */
exports.getDashboardStats = async (req, res) => {
  try {
    const domains = [
      "MEDICAL", "PHARMACY", "NURSING", "PARAMEDICAL",
      "ENGINEERING", "MANAGEMENT", "GRADUATION", 
      "POST GRADUATION", "VOCATIONAL", "LANGUAGES",
      "AGRICULTURE", "EDUCATION"
    ];

    const domainStats = [];
    let totalNew = 0;
    let totalInProgress = 0;
    let totalCompleted = 0;
    
    for (const domain of domains) {
      const total = await Client.countDocuments({ domain });
      const newCount = await Client.countDocuments({ 
        domain, 
        domainViewed: false,
        newAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      const inProgress = await Client.countDocuments({ domain, status: 'in-progress' });
      const completed = await Client.countDocuments({ domain, status: 'completed' });
      
      totalNew += newCount;
      totalInProgress += inProgress;
      totalCompleted += completed;
      
      domainStats.push({
        domain,
        total,
        new: newCount,
        inProgress,
        completed,
        hasNew: newCount > 0
      });
    }

    const totalStudents = totalNew + totalInProgress + totalCompleted;

    // Recent students (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentStudents = await Client.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Today's students
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStudents = await Client.countDocuments({
      createdAt: { $gte: today }
    });

    res.status(200).json({
      success: true,
      data: {
        domainStats,
        summary: {
          total: totalStudents,
          new: totalNew,
          inProgress: totalInProgress,
          completed: totalCompleted,
          recent: recentStudents,
          today: todayStudents
        }
      }
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   GET RECENT NEW STUDENTS
================================ */
exports.getRecentNewStudents = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const newStudents = await Client.find({
      newAt: { $gte: sevenDaysAgo },
      domainViewed: false
    })
    .select('fullName email phone domain course status newAt domainViewed courseViewed studentViewed')
    .sort({ newAt: -1 })
    .limit(50);

    res.status(200).json({
      success: true,
      count: newStudents.length,
      data: newStudents
    });

  } catch (error) {
    console.error("Get recent new students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   BULK MARK AS VIEWED
================================ */
exports.bulkMarkAsViewed = async (req, res) => {
  try {
    const { ids, type } = req.body; // type: 'domain', 'course', or 'student'
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of IDs is required"
      });
    }

    if (!type || !['domain', 'course', 'student'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'domain', 'course', or 'student'"
      });
    }

    let updateField = '';
    let query = { _id: { $in: ids } };

    switch (type) {
      case 'domain':
        updateField = 'domainViewed';
        break;
      case 'course':
        updateField = 'courseViewed';
        break;
      case 'student':
        updateField = 'studentViewed';
        break;
    }

    await Client.updateMany(
      query,
      { 
        [updateField]: true,
        ...(type === 'student' ? { isNew: false } : {})
      }
    );

    res.status(200).json({
      success: true,
      message: `Bulk marked ${type}s as viewed`,
      count: ids.length
    });

  } catch (error) {
    console.error("Bulk mark as viewed error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   GET UNVIEWED COUNTS
================================ */
exports.getUnviewedCounts = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const domainUnviewed = await Client.countDocuments({
      domainViewed: false,
      newAt: { $gte: sevenDaysAgo }
    });

    const courseUnviewed = await Client.countDocuments({
      courseViewed: false,
      newAt: { $gte: sevenDaysAgo }
    });

    const studentUnviewed = await Client.countDocuments({
      studentViewed: false,
      isNew: true,
      newAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      counts: {
        domain: domainUnviewed,
        course: courseUnviewed,
        student: studentUnviewed
      }
    });

  } catch (error) {
    console.error("Get unviewed counts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===============================
   AUTO MARK OLD AS VIEWED (CRON JOB)
================================ */
exports.autoMarkOldAsViewed = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Automatically mark students older than 30 days as viewed
    const result = await Client.updateMany(
      {
        newAt: { $lt: thirtyDaysAgo },
        $or: [
          { domainViewed: false },
          { courseViewed: false },
          { studentViewed: false },
          { isNew: true }
        ]
      },
      {
        domainViewed: true,
        courseViewed: true,
        studentViewed: true,
        isNew: false
      }
    );

    console.log(`Auto-marked ${result.modifiedCount} old students as viewed`);

    res.status(200).json({
      success: true,
      message: "Auto-marked old students as viewed",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Auto mark old as viewed error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};