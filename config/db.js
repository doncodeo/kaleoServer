const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Initial connection to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected!");

        // Handle connection error
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        // Handle disconnection and attempt reconnection
        mongoose.connection.on('disconnected', async () => {
            console.error('MongoDB disconnected. Trying to reconnect...');
            try {
                await mongoose.connect(process.env.MONGO_URI);
                console.log("MongoDB reconnected!");
            } catch (err) {
                console.error(`MongoDB reconnection error: ${err}`);
            }
        });

    } catch (error) {
        console.error(`Initial MongoDB connection error: ${error}`);
        process.exit(1); // Exit the process with failure
    }
}

module.exports = connectDB;








// const mongoose = require('mongoose');

// const connectDB = async () => {
//     try{
//         const conn = await mongoose.connect(process.env.MONGO_URI)
//         console.log("MongoDB connected!")

//         // check why server keeps gooing off

//         mongoose.connection.on('error', (err) => {
//             console.error(`MongoDB connection error: ${err}`);
//           });
          
//           mongoose.connection.on('disconnected', () => {
//             console.error('MongoDB disconnected. Trying to reconnect...');
//             mongoose.connect(process.env.MONGO_URI, {
//               useNewUrlParser: true,
//               useUnifiedTopology: true
//             });
//           });
//     } catch (error){
//         console.log(error)
//         process.exit(1)
//     }
// }

// module.exports = connectDB