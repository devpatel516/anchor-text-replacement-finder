const express = require('express');
const router=express.Router();
const {extract}=require('../controllers/analyzeController');
router.post('/extract',extract);

module.exports=router;