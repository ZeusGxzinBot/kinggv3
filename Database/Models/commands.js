export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Commands', {
        author: DataTypes.STRING,
        date: DataTypes.BIGINT,
        content: DataTypes.STRING(4000),
        name: DataTypes.STRING,
        message: DataTypes.STRING,
        channel: DataTypes.STRING,
        guild: DataTypes.STRING,
        aliases: DataTypes.ARRAY(DataTypes.STRING)
    });

    return model
}