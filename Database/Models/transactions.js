export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Transactions', {
        source: { type: DataTypes.INTEGER },
        given_by: { type: DataTypes.STRING },
        received_by: { type: DataTypes.STRING },
        given_by_tag: { type: DataTypes.STRING },
        received_by_tag: { type: DataTypes.STRING },
        given_at: { type: DataTypes.BIGINT },
        amount: { type: DataTypes.BIGINT },
        users: { type: DataTypes.ARRAY(DataTypes.STRING) },
        message: { type: DataTypes.STRING }
    })

    return model
}