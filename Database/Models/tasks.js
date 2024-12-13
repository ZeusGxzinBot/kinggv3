export default async function (sequelize, DataTypes) {
    let tasks = await sequelize.define('Tasks', {
        id: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
        work: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        crime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        reps: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        bets: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        vote: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        raffle: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        daily: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    })

    return tasks
}