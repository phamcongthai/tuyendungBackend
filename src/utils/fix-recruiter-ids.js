// Script to fix recruiterId field in jobs collection
// Convert string recruiterId to ObjectId

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string - adjust as needed
const MONGODB_URI = 'mongodb://localhost:27017/job_recruitment_db';

async function fixRecruiterIds() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('📡 Connected to MongoDB');
        
        const db = client.db();
        const jobsCollection = db.collection('jobs');
        
        // Find all jobs where recruiterId is a string
        const jobsWithStringRecruiterId = await jobsCollection.find({
            recruiterId: { $type: "string" }
        }).toArray();
        
        console.log(`🔍 Found ${jobsWithStringRecruiterId.length} jobs with string recruiterId`);
        
        let fixedCount = 0;
        let errorCount = 0;
        
        for (const job of jobsWithStringRecruiterId) {
            try {
                // Convert string to ObjectId
                const recruiterObjectId = new ObjectId(job.recruiterId);
                
                // Update the job
                await jobsCollection.updateOne(
                    { _id: job._id },
                    { 
                        $set: { 
                            recruiterId: recruiterObjectId 
                        } 
                    }
                );
                
                console.log(`✅ Fixed job ${job._id}: ${job.recruiterId} -> ObjectId`);
                fixedCount++;
            } catch (error) {
                console.error(`❌ Error fixing job ${job._id}:`, error.message);
                errorCount++;
            }
        }
        
        // Also fix companyId if needed
        const jobsWithStringCompanyId = await jobsCollection.find({
            companyId: { $type: "string" }
        }).toArray();
        
        console.log(`🔍 Found ${jobsWithStringCompanyId.length} jobs with string companyId`);
        
        for (const job of jobsWithStringCompanyId) {
            try {
                // Convert string to ObjectId
                const companyObjectId = new ObjectId(job.companyId);
                
                // Update the job
                await jobsCollection.updateOne(
                    { _id: job._id },
                    { 
                        $set: { 
                            companyId: companyObjectId 
                        } 
                    }
                );
                
                console.log(`✅ Fixed job ${job._id} companyId: ${job.companyId} -> ObjectId`);
                fixedCount++;
            } catch (error) {
                console.error(`❌ Error fixing job ${job._id} companyId:`, error.message);
                errorCount++;
            }
        }
        
        // Also fix jobCategoryId if needed
        const jobsWithStringJobCategoryId = await jobsCollection.find({
            jobCategoryId: { $type: "string" }
        }).toArray();
        
        console.log(`🔍 Found ${jobsWithStringJobCategoryId.length} jobs with string jobCategoryId`);
        
        for (const job of jobsWithStringJobCategoryId) {
            try {
                // Convert string to ObjectId
                const jobCategoryObjectId = new ObjectId(job.jobCategoryId);
                
                // Update the job
                await jobsCollection.updateOne(
                    { _id: job._id },
                    { 
                        $set: { 
                            jobCategoryId: jobCategoryObjectId 
                        } 
                    }
                );
                
                console.log(`✅ Fixed job ${job._id} jobCategoryId: ${job.jobCategoryId} -> ObjectId`);
                fixedCount++;
            } catch (error) {
                console.error(`❌ Error fixing job ${job._id} jobCategoryId:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`✅ Fixed: ${fixedCount} records`);
        console.log(`❌ Errors: ${errorCount} records`);
        
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the fix
fixRecruiterIds().catch(console.error);
