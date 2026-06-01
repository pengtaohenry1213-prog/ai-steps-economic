#!/usr/bin/env node

const semver = require('semver');

function validateVersion(version) {
  const valid = semver.valid(version);
  return {
    version: version,
    isValid: !!valid,
    normalized: valid,
    errors: valid ? [] : [`"${version}" 不是有效的语义化版本号`]
  };
}

function compareVersions(v1, v2) {
  const valid1 = semver.valid(v1);
  const valid2 = semver.valid(v2);
  
  if (!valid1 || !valid2) {
    return {
      success: false,
      error: "无效的版本号格式",
      details: {
        v1: validateVersion(v1),
        v2: validateVersion(v2)
      }
    };
  }
  
  const comparison = semver.compare(v1, v2);
  let result = "";
  if (comparison > 0) result = ">";
  else if (comparison < 0) result = "<";
  else result = "=";
  
  return {
    success: true,
    v1: v1,
    v2: v2,
    comparison: result,
    isGreater: comparison > 0,
    isLess: comparison < 0,
    isEqual: comparison === 0,
    diff: semver.diff(v1, v2)
  };
}

function suggestVersion(currentVersion, changeType = 'minor') {
  const valid = semver.valid(currentVersion);
  if (!valid) {
    return {
      success: false,
      error: `无效的当前版本号: ${currentVersion}`
    };
  }
  
  const types = ['major', 'minor', 'patch', 'prerelease'];
  if (!types.includes(changeType)) {
    return {
      success: false,
      error: `无效的变更类型: ${changeType}，可选: ${types.join(', ')}`
    };
  }
  
  return {
    success: true,
    current: currentVersion,
    changeType: changeType,
    nextVersion: semver.inc(currentVersion, changeType)
  };
}

function parseRange(range) {
  try {
    const valid = semver.validRange(range);
    return {
      range: range,
      isValid: !!valid,
      normalized: valid,
      errors: valid ? [] : [`"${range}" 不是有效的版本范围`]
    };
  } catch (e) {
    return {
      range: range,
      isValid: false,
      normalized: null,
      errors: [e.message]
    };
  }
}

function checkSatisfies(version, range) {
  const validVersion = semver.valid(version);
  const validRange = semver.validRange(range);
  
  if (!validVersion) {
    return {
      success: false,
      error: `无效的版本号: ${version}`
    };
  }
  
  if (!validRange) {
    return {
      success: false,
      error: `无效的版本范围: ${range}`
    };
  }
  
  return {
    success: true,
    version: version,
    range: range,
    satisfies: semver.satisfies(version, range),
    maxSatisfying: semver.maxSatisfying([version], range)
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'validate') {
    const version = args[1];
    if (!version) {
      console.error('Usage: node version-validator.js validate <version>');
      process.exit(1);
    }
    console.log(JSON.stringify(validateVersion(version), null, 2));
  } else if (command === 'compare') {
    const v1 = args[1];
    const v2 = args[2];
    if (!v1 || !v2) {
      console.error('Usage: node version-validator.js compare <v1> <v2>');
      process.exit(1);
    }
    console.log(JSON.stringify(compareVersions(v1, v2), null, 2));
  } else if (command === 'suggest') {
    const current = args[1];
    const type = args[2] || 'minor';
    if (!current) {
      console.error('Usage: node version-validator.js suggest <current> [type]');
      process.exit(1);
    }
    console.log(JSON.stringify(suggestVersion(current, type), null, 2));
  } else if (command === 'range') {
    const range = args[1];
    if (!range) {
      console.error('Usage: node version-validator.js range <range>');
      process.exit(1);
    }
    console.log(JSON.stringify(parseRange(range), null, 2));
  } else if (command === 'satisfies') {
    const version = args[1];
    const range = args[2];
    if (!version || !range) {
      console.error('Usage: node version-validator.js satisfies <version> <range>');
      process.exit(1);
    }
    console.log(JSON.stringify(checkSatisfies(version, range), null, 2));
  } else {
    console.log(`Usage:
  node version-validator.js validate <version>
  node version-validator.js compare <v1> <v2>
  node version-validator.js suggest <current> [type]
  node version-validator.js range <range>
  node version-validator.js satisfies <version> <range>

Examples:
  node version-validator.js validate 1.2.3
  node version-validator.js compare 1.0.0 2.0.0
  node version-validator.js suggest 1.2.3 minor
  node version-validator.js range ^1.0.0
  node version-validator.js satisfies 1.2.3 ^1.0.0`);
  }
}

module.exports = {
  validateVersion,
  compareVersions,
  suggestVersion,
  parseRange,
  checkSatisfies
};
