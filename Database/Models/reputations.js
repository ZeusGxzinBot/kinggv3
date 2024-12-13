export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Reputations', {
        given_by: DataTypes.STRING,
        received_by: DataTypes.STRING,
        given_by_tag: DataTypes.STRING,
        received_by_tag: DataTypes.STRING,
        given_at: DataTypes.BIGINT,
        message: DataTypes.STRING
    })

    return model
}