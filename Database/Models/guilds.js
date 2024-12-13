export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Guild', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        prefix: { type: DataTypes.STRING, defaultValue: 'k' },
        warn_message: { type: DataTypes.STRING, defaultValue: '❌ {{author}}, meus comandos foram bloqueados nesse canal pelos administradores do servidor!' },
        allowed_channels: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        allowed_roles: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        ban: { type: DataTypes.BOOLEAN, defaultValue: true },
        premium: { type: DataTypes.BIGINT, defaultValue: 0 },
    })

    return model
}