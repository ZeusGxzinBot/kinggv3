export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('Social', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        reps: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        about: {
            type: DataTypes.STRING(200),
            defaultValue: 'Essa é a descrição do seu perfil, você pode alterá-la utilizando o comando <prefixo>sobremim.'
        },
        badges: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        wedding: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        wedding_date: DataTypes.BIGINT,
        wedding_user: DataTypes.STRING,
        background: { type: DataTypes.STRING, allowNull: false, defaultValue: "https://cdn.discordapp.com/attachments/1104547477635465326/1193394852541517884/fundo.png" },
        backgrounds: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ["https://cdn.discordapp.com/attachments/1104547477635465326/1193394852541517884/fundo.png"] }
    })

    return model
}