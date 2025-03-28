const express = require('express');
const router = express.Router();

// 使用说明页面
router.get('/', (req, res) => {
  res.render('help', { 
    title: '使用说明'
  });
});

module.exports = router;