export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Employees', {
        id: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
        job: { type: DataTypes.STRING },
        join_date: { type: DataTypes.BIGINT },
        salary: { type: DataTypes.INTEGER, defaultValue: 0 },
        level: { type: DataTypes.INTEGER, defaultValue: 0 },
        exp: { type: DataTypes.INTEGER, defaultValue: 0 },
        req: { type: DataTypes.INTEGER, defaultValue: 100 },
        worked: { type: DataTypes.INTEGER, defaultValue: 0 }
    })

    return model
}