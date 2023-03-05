import figlet from 'figlet';
import chalk from 'chalk';
import sqlite3 from 'sqlite3';
import readline from 'readline';


// Create the database connection and initialize the bus schedule table
const db = new sqlite3.Database('bus_schedule.db');
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS schedule (time TEXT PRIMARY KEY, route TEXT)');
  const initialSchedule = [
    ['8:00am', 'Route 1'],
    ['9:30am', 'Route 2'],
    ['11:00am', 'Route 3'],
    ['1:00pm', 'Route 1'],
    ['2:30pm', 'Route 2'],
    ['4:00pm', 'Route 3']
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO schedule (time, route) VALUES (?, ?)');
  initialSchedule.forEach((scheduleItem) => {
    stmt.run(scheduleItem);
  });
  stmt.finalize();
});

// Print the heading using Figlet
figlet('Bus Schedule', (err, heading) => {
  if (err) {
    console.log(chalk.red('Error: Failed to generate heading.'));
    return;
  }
  console.log(chalk.blue(heading));

  // Print the current schedule from the database using Chalk
  console.log('Current bus schedule:');
  db.all('SELECT * FROM schedule', (err, rows) => {
    if (err) {
      console.log(chalk.red('Error: Failed to retrieve bus schedule.'));
      return;
    }
    rows.forEach((row) => {
      console.log(chalk.green(row.time) + ': ' + chalk.yellow(row.route));
    });
    console.log('');
    promptUser();
  });
});

// Prompt the user to enter new bus routes and times and update the database
function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter a new bus route and time (e.g. \'5:00pm Route 4\'), or press enter to quit: ', (input) => {
    rl.close();
    if (input.trim() === '') {
      console.log('Goodbye!');
      db.close();
      return;
    }
    const [time, route] = input.trim().split(' ');
    if (!time || !route) {
      console.log(chalk.red('Error: Invalid input. Please enter the bus route and time in the correct format.'));
      promptUser();
      return;
    }
    db.run('INSERT OR IGNORE INTO schedule (time, route) VALUES (?, ?)', [time, route], (err) => {
      if (err) {
        console.log(chalk.red('Error: Failed to add new bus route.'));
        promptUser();
        return;
      }
      console.log(chalk.green('New bus route added successfully!'));
      promptUser();
    });
  });
}
