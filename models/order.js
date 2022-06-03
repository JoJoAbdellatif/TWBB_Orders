const mongoose  =require('mongoose');
mongoose.pluralize(null);

const orderSchema = new mongoose.Schema({
    Items:[{
        ProductId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        },
        Quantity:{
            type: Number,
            range:[1,50]
        }
    }
    ],
    Status:{
        type: String,
        default:'CREATED',
        required: true
    },
    Address:{
        City:{
        type:String,
        required:true,
        },
        District:{
            type:String,
            required:true,
        },
        StreetName:{
            type:String,
            required:true,
        },
        BuildingNo:{
            type:String,
            required:true,
        },
        Floor:{
            type:Number,
            required:true,
        },
        ApartmentNo:{
            type:Number,
        }
    },
    PhoneNumber:{
        type:String,
        required:true,
    },
    UserId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'      
    },
    Email:{
        type:String,
        required:true,
    }
}
)

const order = mongoose.model('Order',orderSchema);

module.exports = order;