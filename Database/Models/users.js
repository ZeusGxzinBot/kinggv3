export default async function (sequelize, DataTypes) {
    let model = await sequelize.define('User', {
        id: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
        money: { type: DataTypes.BIGINT, defaultValue: 0 },
        donated: { type: DataTypes.INTEGER, defaultValue: 0 },
        votes: { type: DataTypes.INTEGER, defaultValue: 0 },
        premium: { type: DataTypes.BIGINT, defaultValue: 0 },
        tickets: { type: DataTypes.INTEGER, defaultValue: 0 },
        bets: { type: DataTypes.INTEGER, defaultValue: 0 },

        ban: DataTypes.BOOLEAN,
        ban_reason: DataTypes.STRING(2500),
        ban_date: DataTypes.BIGINT,
        ban_by: DataTypes.STRING,
        ban_by_tag: DataTypes.STRING,

        is_afk: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        afk_time: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        afk_reason: { type: DataTypes.STRING, allowNull: true, },
        afk_ping: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [], allowNull: false },
        afk_local: { type: DataTypes.STRING, },

        birthday: { type: DataTypes.STRING, },
        bet_emoji: { type: DataTypes.STRING }
    })

    return model
}