export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Cooldowns', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        daily: DataTypes.BIGINT,
        weekly: DataTypes.BIGINT,
        work: DataTypes.BIGINT,
        rep: DataTypes.BIGINT,
        crime: DataTypes.BIGINT,
        vote: DataTypes.BIGINT,
        vip: DataTypes.BIGINT,
    })

    return model
}