const prisma = require('../prismaClient');

const checkEnrollment = async (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();

  const courseId =
    req.body.courseId ||
    req.query.courseId ||
    req.params.courseId;

  if (!courseId)
    return res.status(400).json({ error: 'courseId is required' });

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: req.user.id,
        courseId: courseId
      }
    }
  });

  if (!enrollment) {
    return res.status(403).json({
      error: 'You are not enrolled in this course. Contact your educator to get access.'
    });
  }

  next();
};

module.exports = { checkEnrollment };